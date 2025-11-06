import { randomUUID } from 'node:crypto';
import http from 'node:http';
import type { IncomingMessage, IncomingHttpHeaders, ServerResponse } from 'node:http';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import ngrok from '@ngrok/ngrok';

import type { OmadaClient } from '../omadaClient/index.js';
import { logger } from '../utils/logger.js';

import { createServer } from './common.js';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PATH = '/mcp';
const HEALTH_PATH = '/healthz';

type ShutdownHandler = () => Promise<void>;

function resolvePort(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65_535) {
        logger.warn('Invalid MCP HTTP port provided', { provided: value, fallback });
        return fallback;
    }

    return parsed;
}

function normalizePath(path: string): string {
    if (!path) {
        return DEFAULT_PATH;
    }

    const startsWithSlash = path.startsWith('/') ? path : `/${path}`;
    if (startsWithSlash.length > 1 && startsWithSlash.endsWith('/')) {
        const trimmed = startsWithSlash.replace(/\/+$/, '');
        return trimmed.length === 0 ? '/' : trimmed;
    }

    return startsWithSlash;
}

function getRequestUrl(req: IncomingMessage, fallbackPort: number): URL | undefined {
    if (!req.url) {
        return undefined;
    }

    const host = req.headers.host ?? `localhost:${fallbackPort}`;
    try {
        return new URL(req.url, `http://${host}`);
    } catch {
        return undefined;
    }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
    });
    res.end(payload);
}

function sanitizeHeaders(headers: IncomingHttpHeaders): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(headers)) {
        if (value === undefined) {
            continue;
        }

        if (Array.isArray(value)) {
            sanitized[key] = value.map((entry) => sanitizeHeaderValue(key, entry));
        } else {
            sanitized[key] = sanitizeHeaderValue(key, value);
        }
    }

    return sanitized;
}

function sanitizeHeaderValue(key: string, value: string): string {
    const sanitized = isSensitiveKey(key) ? maskValue(value) : value;
    return typeof sanitized === 'string' ? sanitized : String(sanitized);
}

function sanitizePayload(payload: unknown): unknown {
    if (payload === null || payload === undefined) {
        return payload;
    }

    if (typeof payload === 'string') {
        return isLikelySensitiveString(payload) ? maskValue(payload) : payload;
    }

    if (Array.isArray(payload)) {
        return payload.map((entry) => sanitizePayload(entry));
    }

    if (typeof payload === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(payload)) {
            sanitized[key] = isSensitiveKey(key) ? maskValue(value) : sanitizePayload(value);
        }
        return sanitized;
    }

    return payload;
}

function isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return (
        normalized.includes('authorization') ||
        normalized.includes('token') ||
        normalized.includes('secret') ||
        normalized.includes('password') ||
        normalized.includes('cookie') ||
        normalized.includes('client-id')
    );
}

function isLikelySensitiveString(value: string): boolean {
    return value.length > 16 && /[A-Za-z0-9+/=]{16,}/.test(value);
}

function maskValue(value: unknown): unknown {
    if (typeof value === 'string') {
        if (value.length <= 8) {
            return '********';
        }
        return `${value.slice(0, 4)}…${value.slice(-4)}`;
    }

    if (Array.isArray(value)) {
        return value.map(() => '********');
    }

    if (typeof value === 'object' && value !== null) {
        return '[masked-object]';
    }

    return '********';
}

async function createShutdownHandler(signal: NodeJS.Signals, closeHttp: () => Promise<void>, closeServer: () => Promise<void>): Promise<void> {
    logger.warn('Received shutdown signal', { signal });

    try {
        await closeServer();
    } catch (error) {
        logger.error('Error closing MCP server', { error });
    }

    try {
        await closeHttp();
    } catch (error) {
        logger.error('Error closing HTTP server', { error });
    }
}

export async function startHttpServer(client: OmadaClient, config: import('../config.js').EnvironmentConfig): Promise<void> {
    logger.info('Starting HTTP server');
    const mcpServer = createServer(client);

    const allowedHosts = config.httpAllowedHosts;
    const allowedOrigins = config.httpAllowedOrigins;

    const enableStatefulSessions = config.stateful;
    const sessionIdGenerator = enableStatefulSessions ? () => randomUUID() : undefined;

    if (!enableStatefulSessions) {
        logger.info('Starting HTTP transport in stateless mode; Mcp-Session-Id headers are optional');
    }

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator,
        allowedHosts,
        allowedOrigins,
    });

    transport.onerror = (error: Error) => {
        logger.error('Streamable HTTP transport error', { error });
    };

    await mcpServer.connect(transport);

    const port = resolvePort(config.httpPort?.toString(), DEFAULT_PORT);
    const host = config.httpHost ?? DEFAULT_HOST;
    const endpointPath = normalizePath(config.httpPath ?? DEFAULT_PATH);


    const httpServer = http.createServer((req, res) => {
        void (async () => {
            const url = getRequestUrl(req, port);
            if (!url) {
                logger.warn('HTTP request rejected', {
                    reason: 'invalid-url',
                    method: req.method,
                    url: req.url,
                });
                sendJson(res, 400, { error: 'Invalid request URL.' });
                return;
            }

            logger.debug('HTTP request headers', {
                method: req.method,
                path: url.pathname,
                headers: sanitizeHeaders(req.headers),
            });

            const bodyChunks: Buffer[] = [];
            const shouldCaptureBody = (req.method ?? 'GET').toUpperCase() !== 'GET';
            if (shouldCaptureBody) {
                req.on('data', (chunk) => {
                    const bufferChunk = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
                    bodyChunks.push(bufferChunk);
                });
            }

            logger.info('HTTP request received', {
                method: req.method,
                path: url.pathname,
                query: url.search,
                sessionId: req.headers['mcp-session-id'] ?? undefined,
            });

            if (url.pathname === HEALTH_PATH) {
                logger.debug('Health check request served');
                sendJson(res, 200, { status: 'ok' });
                return;
            }

            if (url.pathname !== endpointPath) {
                logger.warn('HTTP request rejected', {
                    reason: 'unexpected-path',
                    expected: endpointPath,
                    received: url.pathname,
                });
                sendJson(res, 404, { error: 'Not Found' });
                return;
            }

            try {
                await transport.handleRequest(req, res);
                if (!res.headersSent) {
                    logger.debug('Transport completed without sending response headers');
                }
                logger.info('MCP request handled successfully', {
                    path: url.pathname,
                    method: req.method,
                });

                if (shouldCaptureBody) {
                    const rawBody = bodyChunks.length > 0 ? Buffer.concat(bodyChunks).toString('utf8') : '';
                    let parsedBody: unknown = rawBody;
                    if (rawBody.length === 0) {
                        parsedBody = null;
                    } else {
                        try {
                            parsedBody = JSON.parse(rawBody);
                        } catch {
                            parsedBody = rawBody;
                        }
                    }

                    logger.debug('HTTP request body', {
                        method: req.method,
                        path: url.pathname,
                        length: rawBody.length,
                        body: sanitizePayload(parsedBody),
                    });
                }
            } catch (error) {
                logger.error('Failed to handle MCP HTTP request', { error });
                if (!res.headersSent) {
                    sendJson(res, 500, {
                        jsonrpc: '2.0',
                        error: { code: -32000, message: 'Internal server error' },
                        id: null,
                    });
                } else {
                    res.end();
                }
            }
        })();
    });

    httpServer.on('clientError', (error, socket) => {
        logger.error('HTTP client error', { error });
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

    await new Promise<void>((resolve) => {
        httpServer.listen(port, host, () => {
            const displayHost = host === '0.0.0.0' ? 'localhost' : host;
            logger.info('HTTP server listening', {
                endpoint: `http://${displayHost}:${port}${endpointPath}`,
            });
            logger.info('HTTP health check available', {
                endpoint: `http://${displayHost}:${port}${HEALTH_PATH}`,
            });
            logger.info('HTTP server ready');
            resolve();
        });
    });

    // Start ngrok tunnel if configured
    if (config.httpNgrokEnabled) {
        if (!config.httpNgrokAuthToken) {
            logger.warn('Ngrok enabled but no auth token provided; skipping tunnel setup');
        } else {
            try {
                const listener = await ngrok.forward({
                    addr: port,
                    authtoken: config.httpNgrokAuthToken,
                });
                const url = listener.url();
                logger.info('Ngrok tunnel established', { url });
            } catch (error) {
                logger.error('Failed to start ngrok tunnel', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }

    let shuttingDown = false;
    const closeHttp: ShutdownHandler = () =>
        new Promise((resolve) => {
            httpServer.close(() => resolve());
        });
    const closeServer: ShutdownHandler = () => mcpServer.close();

    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.on(signal, () => {
            if (shuttingDown) {
                return;
            }
            shuttingDown = true;
            void createShutdownHandler(signal, closeHttp, closeServer);
        });
    }
}
