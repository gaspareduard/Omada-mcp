import { EventEmitter } from 'node:events';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EnvironmentConfig } from '../../src/config.js';

type ProcessOnArgs = Parameters<typeof process.on>;

const httpModule = vi.hoisted(() => {
    const eventHandlers = new Map<string, (...args: unknown[]) => void>();
    const server = {
        listen: vi.fn((port: number, host: string, callback: () => void) => {
            callback();
        }),
        close: vi.fn((callback?: () => void) => {
            callback?.();
        }),
        on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
            eventHandlers.set(event, callback);
            return server;
        }),
    };
    const emit = (event: string, ...args: unknown[]) => {
        eventHandlers.get(event)?.(...args);
    };
    let handler: ((req: unknown, res: unknown) => Promise<void>) | undefined;
    return {
        server,
        emit,
        setHandler(fn: (req: unknown, res: unknown) => Promise<void>) {
            handler = fn;
        },
        getHandler() {
            return handler;
        },
        createServer: vi.fn((fn: (req: unknown, res: unknown) => Promise<void>) => {
            handler = fn;
            return server;
        }),
    };
});

const loggerModule = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }));

const ngrokModule = vi.hoisted(() => ({
    forward: vi.fn(async () => ({ url: () => 'https://example.ngrok.dev' })),
}));

const sseModule = vi.hoisted(() => {
    const connection = {
        transport: {
            sessionId: 'session-1',
            close: vi.fn().mockResolvedValue(undefined),
            onclose: undefined as (() => void) | undefined,
        },
        server: { close: vi.fn().mockResolvedValue(undefined) },
    };
    return {
        handleSseConnection: vi.fn(async (_client, _config, _messagePath, _req, res: { writeHead: Function }) => {
            await Promise.resolve();
            res.writeHead?.(200, { 'Content-Type': 'text/event-stream' });
            return connection;
        }),
        handleSseMessage: vi.fn(async (_transport, _req, res: { writeHead: Function; end: Function }) => {
            await Promise.resolve();
            res.writeHead?.(200, { 'Content-Type': 'application/json' });
            res.end?.('{}');
            return undefined;
        }),
        getSseMessagePath: vi.fn(() => '/sse/messages'),
        connection,
    };
});

const streamModule = vi.hoisted(() => {
    return {
        handleStreamRequest: vi.fn(async () => undefined),
        closeAllStreamSessions: vi.fn(async () => undefined),
    };
});

vi.mock('node:http', () => ({ default: { createServer: httpModule.createServer }, createServer: httpModule.createServer }));
vi.mock('@ngrok/ngrok', () => ({ default: ngrokModule, ...ngrokModule }));
vi.mock('../../src/server/sse.js', () => ({
    createSseTransport: vi.fn(),
    getSseMessagePath: sseModule.getSseMessagePath,
    handleSseConnection: sseModule.handleSseConnection,
    handleSseMessage: sseModule.handleSseMessage,
}));
vi.mock('../../src/server/stream.js', () => ({
    handleStreamRequest: streamModule.handleStreamRequest,
    closeAllStreamSessions: streamModule.closeAllStreamSessions,
}));
vi.mock('../../src/utils/logger.js', () => ({ logger: loggerModule }));

class MockRequest extends EventEmitter {
    method?: string;
    url?: string;
    headers: Record<string, string | string[]>;

    constructor(init: { method?: string; url?: string; headers?: Record<string, string | string[]> }) {
        super();
        this.method = init.method;
        this.url = init.url;
        this.headers = init.headers ?? {};
    }

    send(body?: string) {
        queueMicrotask(() => {
            if (body) {
                this.emit('data', body);
            }
            this.emit('end');
        });
    }
}

class MockResponse {
    statusCode?: number;
    headers?: Record<string, number | string>;
    body?: string;
    headersSent = false;
    readonly finished: Promise<void>;
    private resolveFinished?: () => void;

    constructor() {
        this.finished = new Promise((resolve) => {
            this.resolveFinished = resolve;
        });
    }

    writeHead(status: number, headers: Record<string, number | string>) {
        this.statusCode = status;
        this.headers = headers;
        this.headersSent = true;
    }

    end(body?: string) {
        this.body = body;
        this.resolveFinished?.();
    }
}

const flushTasks = () => new Promise((resolve) => setImmediate(resolve));

const baseConfig: EnvironmentConfig = {
    baseUrl: 'https://controller.local',
    clientId: 'client-id',
    clientSecret: 'secret',
    omadacId: 'omadac',
    strictSsl: true,
    requestTimeout: 5000,
    logLevel: 'info',
    logFormat: 'plain',
    useHttp: true,
    httpTransport: 'sse',
    httpEnableHealthcheck: true,
    httpAllowCors: true,
    httpNgrokEnabled: false,
};

describe('startHttpServer', () => {
    let processOnSpy: ReturnType<typeof vi.spyOn>;
    const getSignalHandler = (signal: ProcessOnArgs[0]) => {
        const calls = processOnSpy.mock.calls as ProcessOnArgs[];
        const match = calls.find(([registered]) => registered === signal);
        return match?.[1] as (() => void) | undefined;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process);
    });

    afterEach(() => {
        processOnSpy.mockRestore();
    });

    it('handles health, SSE connection, and SSE messages', async () => {
        const { startHttpServer } = await import('../../src/server/http.js');
        await startHttpServer({} as never, baseConfig);
        const handler = httpModule.getHandler();
        expect(handler).toBeDefined();

        const healthReq = new MockRequest({ method: 'GET', url: '/healthz' });
        const healthRes = new MockResponse();
        handler!(healthReq as never, healthRes as never);
        healthReq.send();
        await healthRes.finished;
        expect(healthRes.statusCode).toBe(200);

        const sseReq = new MockRequest({ method: 'GET', url: '/sse' });
        const sseRes = new MockResponse();
        handler!(sseReq as never, sseRes as never);
        sseReq.send();
        await flushTasks();
        expect(sseModule.handleSseConnection).toHaveBeenCalled();

        const msgReq = new MockRequest({ method: 'POST', url: '/sse/messages', headers: { 'mcp-session-id': 'session-1' } });
        const msgRes = new MockResponse();
        handler!(msgReq as never, msgRes as never);
        msgReq.send('{"jsonrpc":"2.0"}');
        await msgRes.finished;
        expect(sseModule.handleSseMessage).toHaveBeenCalled();

        const missingSessionReq = new MockRequest({ method: 'POST', url: '/sse/messages' });
        const missingSessionRes = new MockResponse();
        handler!(missingSessionReq as never, missingSessionRes as never);
        missingSessionReq.send('{}');
        await missingSessionRes.finished;
        expect(missingSessionRes.statusCode).toBe(400);
    });

    it('handles invalid URLs, method mismatches, and missing sessions', async () => {
        const { startHttpServer } = await import('../../src/server/http.js');
        await startHttpServer({} as never, baseConfig);
        const handler = httpModule.getHandler();
        expect(handler).toBeDefined();

        const invalidReq = new MockRequest({ method: 'GET', url: undefined } as never);
        const invalidRes = new MockResponse();
        handler!(invalidReq as never, invalidRes as never);
        await invalidRes.finished;
        expect(invalidRes.statusCode).toBe(400);

        const wrongMethodReq = new MockRequest({ method: 'POST', url: '/sse' });
        const wrongMethodRes = new MockResponse();
        handler!(wrongMethodReq as never, wrongMethodRes as never);
        wrongMethodReq.send('{}');
        await wrongMethodRes.finished;
        expect(wrongMethodRes.statusCode).toBe(405);

        const getMessageReq = new MockRequest({ method: 'GET', url: '/sse/messages' });
        const getMessageRes = new MockResponse();
        handler!(getMessageReq as never, getMessageRes as never);
        getMessageReq.send();
        await getMessageRes.finished;
        expect(getMessageRes.statusCode).toBe(405);

        const unknownSessionReq = new MockRequest({
            method: 'POST',
            url: '/sse/messages',
            headers: { 'mcp-session-id': 'missing' },
        });
        const unknownSessionRes = new MockResponse();
        handler!(unknownSessionReq as never, unknownSessionRes as never);
        unknownSessionReq.send('{}');
        await unknownSessionRes.finished;
        expect(unknownSessionRes.statusCode).toBe(404);

        const notFoundReq = new MockRequest({ method: 'GET', url: '/unknown' });
        const notFoundRes = new MockResponse();
        handler!(notFoundReq as never, notFoundRes as never);
        notFoundReq.send();
        await notFoundRes.finished;
        expect(notFoundRes.statusCode).toBe(404);
    });

    it('processes stream transport requests and handles errors', async () => {
        const { startHttpServer } = await import('../../src/server/http.js');
        const config: EnvironmentConfig = { ...baseConfig, httpTransport: 'stream' };
        await startHttpServer({} as never, config);
        const handler = httpModule.getHandler();
        const streamReq = new MockRequest({ method: 'POST', url: '/mcp', headers: { 'mcp-session-id': 'stream-1' } });
        const streamRes = new MockResponse();
        handler!(streamReq as never, streamRes as never);
        streamReq.send('{"jsonrpc":"2.0"}');
        await flushTasks();
        expect(streamModule.handleStreamRequest).toHaveBeenCalled();
        const streamCallArgs = streamModule.handleStreamRequest.mock.calls[0] as unknown[];
        const sessionMapArg = streamCallArgs[5];
        expect(sessionMapArg).toBeInstanceOf(Map);

        const errorReq = new MockRequest({ method: 'POST', url: '/unknown' });
        const errorRes = new MockResponse();
        handler!(errorReq as never, errorRes as never);
        errorReq.send('{}');
        await errorRes.finished;
        expect(errorRes.statusCode).toBe(404);
    });

    it('warns when ngrok enabled without token', async () => {
        const { startHttpServer } = await import('../../src/server/http.js');
        await startHttpServer({} as never, { ...baseConfig, httpNgrokEnabled: true });
        expect(loggerModule.warn).toHaveBeenCalledWith('Ngrok enabled but no auth token provided; skipping tunnel setup');
    });

    it('handles handler failures and client errors gracefully', async () => {
        const { startHttpServer } = await import('../../src/server/http.js');
        sseModule.handleSseConnection.mockRejectedValueOnce(new Error('connect-fail'));
        await startHttpServer({} as never, baseConfig);
        const handler = httpModule.getHandler();
        expect(handler).toBeDefined();

        const failingReq = new MockRequest({ method: 'GET', url: '/sse' });
        const failingRes = new MockResponse();
        handler!(failingReq as never, failingRes as never);
        failingReq.send();
        await failingRes.finished;
        expect(failingRes.statusCode).toBe(500);

        const okReq = new MockRequest({ method: 'GET', url: '/sse' });
        const okRes = new MockResponse();
        handler!(okReq as never, okRes as never);
        okReq.send();
        await flushTasks();

        sseModule.handleSseMessage.mockImplementationOnce(async (_transport, _req, res) => {
            res.writeHead?.(200, { 'Content-Type': 'application/json' });
            await Promise.resolve();
            throw new Error('message-fail');
        });

        const errorMsgReq = new MockRequest({
            method: 'POST',
            url: '/sse/messages',
            headers: { 'mcp-session-id': 'session-1' },
        });
        const errorMsgRes = new MockResponse();
        handler!(errorMsgReq as never, errorMsgRes as never);
        errorMsgReq.send('{}');
        await errorMsgRes.finished;
        expect(errorMsgRes.headersSent).toBe(true);
        expect(loggerModule.error).toHaveBeenCalledWith('Failed to handle MCP HTTP request', expect.objectContaining({ error: expect.any(Error) }));

        const socket = { end: vi.fn() };
        httpModule.emit('clientError', new Error('bad-request'), socket);
        expect(socket.end).toHaveBeenCalledWith('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    it('establishes ngrok tunnel and normalizes host when auth token provided', async () => {
        const { startHttpServer } = await import('../../src/server/http.js');
        await startHttpServer({} as never, {
            ...baseConfig,
            httpNgrokEnabled: true,
            httpNgrokAuthToken: 'token-123',
            httpBindAddr: '0.0.0.0',
        });

        expect(ngrokModule.forward).toHaveBeenCalledWith(expect.objectContaining({ authtoken: 'token-123' }));
        expect(loggerModule.info).toHaveBeenCalledWith('Ngrok tunnel established', { url: 'https://example.ngrok.dev' });
        const listeningCall = loggerModule.info.mock.calls.find((call) => call[0] === 'HTTP server listening');
        expect(listeningCall?.[1]).toEqual(expect.objectContaining({ endpoint: expect.stringContaining('http://localhost:3000') }));
    });

    it('closes SSE and stream sessions on shutdown signals', async () => {
        const { startHttpServer } = await import('../../src/server/http.js');

        await startHttpServer({} as never, baseConfig);
        const sseHandler = httpModule.getHandler();
        expect(sseHandler).toBeDefined();

        const sseReq = new MockRequest({ method: 'GET', url: '/sse' });
        const sseRes = new MockResponse();
        sseHandler!(sseReq as never, sseRes as never);
        sseReq.send();
        await flushTasks();

        getSignalHandler('SIGINT')?.();
        await flushTasks();
        await flushTasks();

        expect(sseModule.connection.server.close).toHaveBeenCalled();
        expect(sseModule.connection.transport.close).toHaveBeenCalled();

        processOnSpy.mockClear();
        httpModule.server.close.mockClear();

        const streamConfig: EnvironmentConfig = { ...baseConfig, httpTransport: 'stream' };
        await startHttpServer({} as never, streamConfig);
        const streamHandler = httpModule.getHandler();
        expect(streamHandler).toBeDefined();

        const streamReq = new MockRequest({ method: 'POST', url: '/mcp', headers: { 'mcp-session-id': 'stream-1' } });
        const streamRes = new MockResponse();
        streamHandler!(streamReq as never, streamRes as never);
        streamReq.send('{"jsonrpc":"2.0"}');
        await flushTasks();

        getSignalHandler('SIGTERM')?.();
        await flushTasks();
        await flushTasks();

        expect(httpModule.server.close).toHaveBeenCalled();
        expect(streamModule.closeAllStreamSessions).toHaveBeenCalled();
    });
});
