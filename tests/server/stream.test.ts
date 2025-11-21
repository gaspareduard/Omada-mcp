import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnvironmentConfig } from '../../src/config.js';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { createServer } from '../../src/server/common.js';
import type { StreamTransportState } from '../../src/server/stream.js';
import { closeAllStreamSessions, createStreamTransport, handleStreamRequest } from '../../src/server/stream.js';
import { logger } from '../../src/utils/logger.js';

// Mock dependencies
vi.mock('../../src/utils/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock('../../src/server/common.js', () => ({
    createServer: vi.fn(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        server: {
            oninitialized: undefined,
            onclose: undefined,
            onerror: undefined,
            fallbackRequestHandler: undefined,
            fallbackNotificationHandler: undefined,
        },
    })),
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => {
    return {
        StreamableHTTPServerTransport: vi.fn(function (
            this: {
                handleRequest: ReturnType<typeof vi.fn>;
                close: ReturnType<typeof vi.fn>;
                onerror: unknown;
            },
            options: {
                onsessioninitialized?: (sessionId: string) => void;
                onsessionclosed?: (sessionId: string) => void;
            }
        ) {
            this.handleRequest = vi.fn().mockResolvedValue(undefined);
            this.close = vi.fn().mockResolvedValue(undefined);
            this.onerror = undefined;
        }),
    };
});

describe('Stream Server', () => {
    let mockClient: OmadaClient;
    let mockConfig: EnvironmentConfig;
    let mockRes: ServerResponse;
    let mockReq: IncomingMessage;
    let streamSessions: Map<string, StreamTransportState>;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock OmadaClient
        mockClient = {} as OmadaClient;

        // Mock EnvironmentConfig
        mockConfig = {
            omadacId: 'test-omadac-id',
            baseUrl: 'https://test.local',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            strictSsl: true,
            requestTimeout: 30000,
            httpAllowedOrigins: ['http://localhost', 'http://127.0.0.1'],
            httpBindAddr: '127.0.0.1',
            httpPort: 3000,
            httpTransport: 'stream',
            httpPath: '/mcp',
            httpEnableHealthcheck: true,
            httpHealthcheckPath: '/healthz',
            httpAllowCors: true,
            httpNgrokEnabled: false,
            logLevel: 'info',
            logFormat: 'plain',
        } as EnvironmentConfig;

        streamSessions = new Map();

        // Mock ServerResponse
        mockRes = {
            writeHead: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
            on: vi.fn(),
        } as unknown as ServerResponse;

        // Mock IncomingMessage
        mockReq = {
            method: 'POST',
            url: '/mcp',
            headers: {
                host: 'localhost:3000',
                origin: 'http://localhost',
            },
            on: vi.fn(),
        } as unknown as IncomingMessage;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createStreamTransport', () => {
        it('should create Stream transport with session management enabled', () => {
            const { transport, server } = createStreamTransport(mockClient, mockConfig);

            expect(StreamableHTTPServerTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionIdGenerator: expect.any(Function),
                    allowedOrigins: mockConfig.httpAllowedOrigins,
                    enableDnsRebindingProtection: true,
                })
            );

            expect(transport).toBeDefined();
            expect(server).toBeDefined();
            expect(transport.onerror).toBeDefined();
        });

        it('should log startup message describing optional session IDs', () => {
            createStreamTransport(mockClient, mockConfig);

            expect(logger.info).toHaveBeenCalledWith(
                'Starting Streamable HTTP transport; Mcp-Session-Id headers are optional in client-credentials mode'
            );
        });

        it('should set up session callbacks', () => {
            createStreamTransport(mockClient, mockConfig);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];

            expect(callArgs.onsessioninitialized).toBeDefined();
            expect(callArgs.onsessionclosed).toBeDefined();
        });

        it('should call onsessioninitialized callback', () => {
            createStreamTransport(mockClient, mockConfig);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];
            const sessionId = 'test-session-id';

            callArgs.onsessioninitialized?.(sessionId);

            expect(logger.info).toHaveBeenCalledWith('Session initialized', { sessionId });
        });

        it('should call onsessionclosed callback', () => {
            createStreamTransport(mockClient, mockConfig);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];
            const sessionId = 'test-session-id';

            callArgs.onsessionclosed?.(sessionId);

            expect(logger.info).toHaveBeenCalledWith('Session closed', { sessionId });
        });

        it('should handle transport errors through onerror handler', () => {
            const { transport } = createStreamTransport(mockClient, mockConfig);

            const testError = new Error('Transport error');
            if (transport.onerror) {
                transport.onerror(testError);
            }

            expect(logger.error).toHaveBeenCalledWith('Streamable HTTP transport error', {
                error: testError,
                message: testError.message,
            });
        });

        it('should generate unique session IDs for each connection', () => {
            createStreamTransport(mockClient, mockConfig);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];
            const sessionId1 = callArgs.sessionIdGenerator?.();
            const sessionId2 = callArgs.sessionIdGenerator?.();

            expect(sessionId1).toBeDefined();
            expect(sessionId2).toBeDefined();
            expect(sessionId1).not.toBe(sessionId2);
        });
    });

    describe('handleStreamRequest', () => {
        it('creates a new session when no session header is provided', async () => {
            await handleStreamRequest(mockClient, mockConfig, mockReq, mockRes, undefined, streamSessions);

            expect(StreamableHTTPServerTransport).toHaveBeenCalled();
            const transportCall = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];
            transportCall.onsessioninitialized?.('new-session');

            expect(streamSessions.has('new-session')).toBe(true);
            const serverMock = vi.mocked(createServer).mock.results[0].value;
            expect(serverMock.connect).toHaveBeenCalled();
        });

        it('reuses existing sessions when the header matches', async () => {
            const existingState = createStreamTransport(mockClient, mockConfig);
            existingState.connected = true;
            streamSessions.set('existing-session', existingState);

            const reqWithSession = {
                ...mockReq,
                headers: { ...mockReq.headers, 'mcp-session-id': 'existing-session' },
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfig, reqWithSession, mockRes, undefined, streamSessions);

            expect(existingState.transport.handleRequest).toHaveBeenCalledWith(reqWithSession, mockRes, undefined);
            expect(existingState.server.connect).not.toHaveBeenCalled();
        });

        it('returns 404 when a session header does not match any tracked session', async () => {
            const reqWithUnknownSession = {
                ...mockReq,
                headers: { ...mockReq.headers, 'mcp-session-id': 'missing-session' },
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfig, reqWithUnknownSession, mockRes, undefined, streamSessions);

            expect(mockRes.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
            expect(mockRes.end).toHaveBeenCalled();
        });

        it('logs missing origin or host headers with placeholders', async () => {
            const reqWithoutOrigin = {
                ...mockReq,
                headers: {
                    host: 'localhost:3000',
                },
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfig, reqWithoutOrigin, mockRes, undefined, streamSessions);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    origin: '(not set)',
                })
            );
        });

        it('should handle missing host header', async () => {
            const reqWithoutHost = {
                ...mockReq,
                headers: {
                    origin: 'http://localhost',
                },
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfig, reqWithoutHost, mockRes, undefined, streamSessions);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    host: '(not set)',
                })
            );
        });

        it('should pass parsed body to transport', async () => {
            const parsedBody = { method: 'initialize', params: {} };

            await handleStreamRequest(mockClient, mockConfig, mockReq, mockRes, parsedBody, streamSessions);

            const transport = vi.mocked(StreamableHTTPServerTransport).mock.results[0].value;
            expect(transport.handleRequest).toHaveBeenCalledWith(mockReq, mockRes, parsedBody);
        });

        it('should log successful request handling', async () => {
            await handleStreamRequest(mockClient, mockConfig, mockReq, mockRes, undefined, streamSessions);

            expect(logger.debug).toHaveBeenCalledWith('Streamable HTTP request handled', {
                method: 'POST',
                sessionId: '(new-session)',
            });
        });

        it('should handle transport errors and log', async () => {
            const testError = new Error('Request handling failed');
            // @ts-expect-error - Mock implementation for testing error handling
            vi.mocked(StreamableHTTPServerTransport).mockImplementationOnce(function (this: Record<string, unknown>) {
                this.handleRequest = vi.fn().mockRejectedValue(testError);
                this.onerror = undefined;
            });

            await expect(handleStreamRequest(mockClient, mockConfig, mockReq, mockRes, undefined, streamSessions)).rejects.toThrow(
                'Request handling failed'
            );

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to handle Streamable HTTP request',
                expect.objectContaining({
                    error: testError,
                    method: 'POST',
                    url: '/mcp',
                    origin: 'http://localhost',
                    host: 'localhost:3000',
                    allowedOrigins: mockConfig.httpAllowedOrigins,
                })
            );
        });

        it('should handle GET requests', async () => {
            const getReq = {
                ...mockReq,
                method: 'GET',
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfig, getReq, mockRes, undefined, streamSessions);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });

        it('should handle DELETE requests', async () => {
            const deleteReq = {
                ...mockReq,
                method: 'DELETE',
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfig, deleteReq, mockRes, undefined, streamSessions);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });

        it('closes all sessions via helper', async () => {
            const firstState = createStreamTransport(mockClient, mockConfig);
            const secondState = createStreamTransport(mockClient, mockConfig);
            streamSessions.set('one', firstState);
            streamSessions.set('two', secondState);

            await closeAllStreamSessions(streamSessions);

            expect(firstState.server.close).toHaveBeenCalled();
            expect(secondState.server.close).toHaveBeenCalled();
            expect(firstState.transport.close).toHaveBeenCalled();
            expect(secondState.transport.close).toHaveBeenCalled();
            expect(streamSessions.size).toBe(0);
        });
    });
});
