import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { EnvironmentConfig } from '../config.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { logger } from '../utils/logger.js';
import { createServer } from './common.js';

export interface StreamTransportState {
    transport: StreamableHTTPServerTransport;
    server: ReturnType<typeof createServer>;
    connected: boolean;
    closed: boolean;
    lastAccessed: number;
}

type StreamSessionMap = Map<string, StreamTransportState>;

interface StreamLifecycleHooks {
    onSessionInitialized?: (sessionId: string) => void;
    onSessionClosed?: (sessionId: string) => void;
}

function respondWithJson(res: ServerResponse, statusCode: number, payload: unknown): void {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}

async function connectSession(state: StreamTransportState): Promise<void> {
    if (state.connected || state.closed) {
        return;
    }

    if (typeof state.server.connect === 'function') {
        await state.server.connect(state.transport);
        state.connected = true;
    }
}

async function closeTransport(state: StreamTransportState, sessionId?: string): Promise<void> {
    if (state.closed) {
        return;
    }

    state.closed = true;
    state.connected = false;

    try {
        if (typeof state.server.close === 'function') {
            await state.server.close();
        }
    } catch (error) {
        logger.error('Failed to close Streamable HTTP server', { error, sessionId });
    }

    try {
        if (typeof state.transport.close === 'function') {
            await state.transport.close();
        }
    } catch (error) {
        logger.error('Failed to close Streamable HTTP transport', { error, sessionId });
    }
}

function getSessionIdFromHeaders(req: IncomingMessage): string | undefined {
    const header = req.headers['mcp-session-id'];
    if (Array.isArray(header)) {
        return header[0];
    }
    return header;
}

/**
 * Creates a Streamable HTTP transport
 * This implements the MCP protocol version 2025-03-26
 */
export function createStreamTransport(client: OmadaClient, config: EnvironmentConfig, hooks?: StreamLifecycleHooks): StreamTransportState {
    const mcpServer = createServer(client);

    logger.info('Starting Streamable HTTP transport; Mcp-Session-Id headers are optional in client-credentials mode');

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        allowedOrigins: config.httpAllowedOrigins,
        enableDnsRebindingProtection: true,
        onsessioninitialized: (sessionId: string) => {
            logger.info('Session initialized', { sessionId });
            hooks?.onSessionInitialized?.(sessionId);
        },
        onsessionclosed: (sessionId: string) => {
            logger.info('Session closed', { sessionId });
            hooks?.onSessionClosed?.(sessionId);
        },
    });

    transport.onerror = (error: Error) => {
        logger.error('Streamable HTTP transport error', {
            error,
            message: error.message,
        });
    };

    return {
        transport,
        server: mcpServer,
        connected: false,
        closed: false,
        lastAccessed: Date.now(),
    };
}

/**
 * Handles incoming Streamable HTTP requests (GET, POST, DELETE) using persistent session state
 */
export async function handleStreamRequest(
    client: OmadaClient,
    config: EnvironmentConfig,
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody: unknown = undefined,
    sessions: StreamSessionMap
): Promise<void> {
    const originHeader = req.headers.origin;
    const hostHeader = req.headers.host;
    const headerSessionId = getSessionIdFromHeaders(req);

    logger.info('Streamable HTTP request received', {
        method: req.method,
        url: req.url,
        sessionId: headerSessionId ?? undefined,
        origin: originHeader ?? '(not set)',
        host: hostHeader ?? '(not set)',
    });

    let state: StreamTransportState | undefined = headerSessionId ? sessions.get(headerSessionId) : undefined;

    if (headerSessionId && !state) {
        logger.warn('Stream session not found', { sessionId: headerSessionId, method: req.method, url: req.url });
        respondWithJson(res, 404, { error: 'Stream session not found', jsonrpc: '2.0', id: null });
        return;
    }

    const isNewSession = !state;
    if (!state) {
        let pendingState: StreamTransportState;
        const lifecycleHooks: StreamLifecycleHooks = {
            onSessionInitialized: (sessionId: string) => {
                sessions.set(sessionId, pendingState);
                logger.debug('Registered Streamable HTTP session', { sessionId });
            },
            onSessionClosed: (sessionId: string) => {
                sessions.delete(sessionId);
                void closeTransport(pendingState, sessionId);
            },
        };
        pendingState = createStreamTransport(client, config, lifecycleHooks);
        state = pendingState;
        await connectSession(state);
    }

    state.lastAccessed = Date.now();

    try {
        await state.transport.handleRequest(req, res, parsedBody);

        logger.debug('Streamable HTTP request handled', {
            method: req.method,
            sessionId: headerSessionId ?? (isNewSession ? '(new-session)' : undefined),
        });
    } catch (error) {
        logger.error('Failed to handle Streamable HTTP request', {
            error,
            method: req.method,
            url: req.url,
            origin: originHeader ?? '(not set)',
            host: hostHeader ?? '(not set)',
            allowedOrigins: config.httpAllowedOrigins,
        });
        throw error;
    }
}

export async function closeAllStreamSessions(sessions: StreamSessionMap): Promise<void> {
    for (const [sessionId, state] of sessions.entries()) {
        await closeTransport(state, sessionId);
        sessions.delete(sessionId);
        logger.info('Closed Streamable HTTP session', { sessionId });
    }
}
