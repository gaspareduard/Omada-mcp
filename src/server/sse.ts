import type { IncomingMessage, ServerResponse } from 'node:http';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { EnvironmentConfig } from '../config.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { logger } from '../utils/logger.js';
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
    const mcpServer = createServer(client);

    const transport = new SSEServerTransport(endpoint, res, {
        allowedOrigins: config.httpAllowedOrigins,
        enableDnsRebindingProtection: true,
    });

    transport.onerror = (error: Error) => {
        logger.error('SSE transport error', { error });
    };

    return { transport, server: mcpServer };
}

/**
 * Handles SSE connection establishment (GET request)
 */
export async function handleSseConnection(
    client: OmadaClient,
    config: EnvironmentConfig,
    endpoint: string,
    req: IncomingMessage,
    res: ServerResponse
): Promise<SSETransportState> {
    logger.info('SSE connection request received', {
        method: req.method,
        url: req.url,
    });

    const { transport, server } = createSseTransport(client, config, endpoint, res);

    await server.connect(transport);
    await transport.start();

    logger.info('SSE connection established', {
        sessionId: transport.sessionId,
    });

    return { transport, server };
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
