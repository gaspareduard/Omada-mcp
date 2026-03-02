import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { type CallToolResult, ListResourcesRequestSchema, type ServerNotification, type ServerRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { registerAllTools } from '../tools/index.js';
import { logger } from '../utils/logger.js';

// Custom headers schema for optional HTTP headers
export const customHeadersSchema = z.record(z.string(), z.string()).optional();

export const siteInputSchema = z.object({
    siteId: z.string().min(1).optional(),
    customHeaders: customHeadersSchema,
});

export const clientIdSchema = siteInputSchema.extend({
    clientId: z.string().min(1, 'clientId (MAC or client identifier) is required'),
});

export const deviceIdSchema = siteInputSchema.extend({
    deviceId: z.string().min(1, 'deviceId (MAC or device identifier) is required'),
});

export const customRequestSchema = z.object({
    method: z.string().default('GET'),
    url: z.string().min(1, 'A controller API path is required'),
    params: z.record(z.string(), z.unknown()).optional(),
    data: z.unknown().optional(),
    siteId: z.string().min(1).optional(),
    customHeaders: customHeadersSchema,
});

export const stackIdSchema = siteInputSchema.extend({
    stackId: z.string().min(1, 'stackId is required'),
});

export function toToolResult(value: unknown): CallToolResult {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

    return {
        content: text ? [{ type: 'text' as const, text }] : [],
    };
}

export function safeSerialize(value: unknown): string {
    try {
        return JSON.stringify(value);
    } catch {
        return '[unserializable]';
    }
}

function summarizeSuccess(method: string, result: unknown): Record<string, unknown> | undefined {
    if (!result || typeof result !== 'object') {
        return undefined;
    }

    const payload = result as Record<string, unknown>;

    switch (method) {
        case 'initialize': {
            const protocolVersion = payload['protocolVersion'];
            return typeof protocolVersion === 'string' ? { protocolVersion } : undefined;
        }
        case 'tools/list': {
            const tools = Array.isArray(payload['tools']) ? payload['tools'] : undefined;
            return tools ? { toolCount: tools.length } : undefined;
        }
        case 'tools/call': {
            const name = payload['name'];
            if (typeof name === 'string') {
                return { tool: name };
            }
            break;
        }
        default:
            break;
    }

    return undefined;
}

export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function wrapToolHandler<Args extends z.ZodRawShape>(
    name: string,
    handler: (args: z.objectOutputType<Args, z.ZodTypeAny>, extra: ToolExtra) => Promise<CallToolResult>
): (args: z.objectOutputType<Args, z.ZodTypeAny>, extra: ToolExtra) => Promise<CallToolResult> {
    return async (args: z.objectOutputType<Args, z.ZodTypeAny>, extra: ToolExtra): Promise<CallToolResult> => {
        const sessionId = extra.sessionId ?? 'unknown-session';
        logger.info('Tool invoked', { tool: name, sessionId, args: safeSerialize(args) });

        try {
            const result = await handler(args, extra);
            logger.info('Tool completed', { tool: name, sessionId });
            return result;
        } catch (error) {
            logger.error('Tool failed', {
                tool: name,
                sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    };
}

function setupServerLogging(server: McpServer): void {
    const protocol = server.server;
    type RequestSchema = Parameters<typeof protocol.setRequestHandler>[0];
    type RequestCallback = Parameters<typeof protocol.setRequestHandler>[1];

    const originalSetRequestHandler = protocol.setRequestHandler.bind(protocol);
    protocol.setRequestHandler = function patchedSetRequestHandler(schema: RequestSchema, handler: RequestCallback) {
        const method = (schema as { shape: { method: { value: string } } }).shape.method.value;
        const wrapped: RequestCallback = async (request, extra) => {
            const sessionId = extra.sessionId ?? 'unknown-session';
            const logFields: Record<string, unknown> = { method, sessionId };
            if ('params' in request) {
                logFields.params = safeSerialize((request as { params: unknown }).params);
            }
            logger.info('MCP request received', logFields);

            try {
                const result = await handler(request, extra);
                const summary = summarizeSuccess(method, result);
                logger.info('MCP request handled', summary ? { method, sessionId, ...summary } : { method, sessionId });
                return result;
            } catch (error) {
                logger.error('MCP request failed', {
                    method,
                    sessionId,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        };

        return originalSetRequestHandler(schema, wrapped);
    };

    server.server.oninitialized = () => {
        interface ServerWithCapabilities {
            getCapabilities?: () => unknown;
        }
        const capabilities = (server.server as unknown as ServerWithCapabilities).getCapabilities?.();
        if (capabilities) {
            logger.info('Server initialization completed', { capabilities });
        } else {
            logger.info('Server initialization completed');
        }
    };

    server.server.onclose = () => {
        logger.warn('Server connection closed');
    };

    // biome-ignore lint/suspicious/noExplicitAny: MCP SDK doesn't provide types for error handler
    server.server.onerror = (error: any) => {
        logger.error('Server error', { error });
    };

    // biome-ignore lint/suspicious/noExplicitAny: MCP SDK doesn't provide types for request handler
    // biome-ignore lint/suspicious/useAwait: Handler signature requires async even without await
    server.server.fallbackRequestHandler = async (request: any, extra: any) => {
        const sessionId = extra.sessionId ?? 'unknown-session';
        logger.warn('Unhandled request received', {
            method: request.method,
            sessionId,
            params: safeSerialize(request.params),
        });
        throw new Error(`Unhandled request: ${request.method}`);
    };

    // biome-ignore lint/suspicious/noExplicitAny: MCP SDK doesn't provide types for notification handler
    // biome-ignore lint/suspicious/useAwait: Handler signature requires async even without await
    server.server.fallbackNotificationHandler = async (notification: any) => {
        logger.warn('Unhandled notification received', {
            method: notification.method,
            params: safeSerialize(notification.params),
        });
    };
}

export function createServer(client: OmadaClient): McpServer {
    const server = new McpServer({
        name: 'tplink-omada-mcp',
        version: '0.1.0',
    });

    setupServerLogging(server);
    registerAllTools(server, client);

    // Register resources capability and resources/list handler to prevent initialization errors
    // in MCP clients like Claude Desktop. Currently, this server does not expose any resources,
    // so we return an empty list.
    server.server.registerCapabilities({
        resources: {},
    });

    server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: [],
    }));

    return server;
}

export { setupServerLogging };
