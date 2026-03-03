import type { IncomingMessage, ServerResponse } from 'node:http';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { EnvironmentConfig } from '../config.js';
import { OmadaClient } from '../omadaClient/index.js';
import { registerAllTools } from '../tools/index.js';
import { logger } from '../utils/logger.js';
import { extractAuthFromHeaders, resolveOmadaConfig } from '../utils/omada-headers.js';
import { createServer } from './common.js';

const MESSAGE_PATH = '/messages';

interface SSETransportState {
    transport: SSEServerTransport;
    server: ReturnType<typeof createServer>;
}

/**
 * Creates an SSE transport for handling HTTP+SSE connections
 * This implements the legacy MCP protocol version 2024-11-05
 */
export function createSseTransport(client: OmadaClient, config: EnvironmentConfig, endpoint: string, res: ServerResponse): SSETransportState {
    const mcpServer = createServer();
    registerAllTools(mcpServer, client);

    const transport = new SSEServerTransport(endpoint, res, {
        allowedOrigins: config.httpAllowedOrigins,
        enableDnsRebindingProtection: true,
    });

    transport.onerror = (error: Error) => {
        logger.error('SSE transport error', {
            error,
            message: error.message,
        });
    };

    return { transport, server: mcpServer };
}

/**
 * Handles SSE connection establishment (GET request).
 * Resolves Omada credentials from env config (wins) and request headers (fallback).
 */
export async function handleSseConnection(
    config: EnvironmentConfig,
    endpoint: string,
    req: IncomingMessage,
    res: ServerResponse
): Promise<SSETransportState> {
    const originHeader = req.headers.origin;
    const hostHeader = req.headers.host;

    logger.info('SSE connection request received', {
        method: req.method,
        url: req.url,
        origin: originHeader ?? '(not set)',
        host: hostHeader ?? '(not set)',
    });

    try {
        const headerAuth = extractAuthFromHeaders(req.headers);
        const omadaConfig = resolveOmadaConfig(config, headerAuth);
        const client = new OmadaClient(omadaConfig);

        const { transport, server } = createSseTransport(client, config, endpoint, res);

        await server.connect(transport);
        await transport.start();

        logger.info('SSE connection established', {
            sessionId: transport.sessionId,
        });

        return { transport, server };
    } catch (error) {
        logger.error('Failed to establish SSE connection', {
            error,
            origin: originHeader ?? '(not set)',
            host: hostHeader ?? '(not set)',
            allowedOrigins: config.httpAllowedOrigins,
        });
        throw error;
    }
}

/**
 * Handles SSE message POST requests
 */
export async function handleSseMessage(
    transport: SSEServerTransport,
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody?: unknown
): Promise<void> {
    logger.debug('SSE message received', {
        sessionId: transport.sessionId,
        hasBody: !!parsedBody,
    });

    await transport.handlePostMessage(req, res, parsedBody);

    logger.debug('SSE message handled', {
        sessionId: transport.sessionId,
    });
}

/**
 * Returns the message endpoint path for SSE transport
 */
export function getSseMessagePath(): string {
    return MESSAGE_PATH;
}
