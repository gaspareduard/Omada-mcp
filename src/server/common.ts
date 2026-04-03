import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { type CallToolResult, ListResourcesRequestSchema, type ServerNotification, type ServerRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import packageMetadata from '../../package.json' with { type: 'json' };

import { logger } from '../utils/logger.js';

// Custom headers schema for optional HTTP headers
export const customHeadersSchema = z.record(z.string(), z.string()).optional();

// Reusable MAC address schema for device identifiers (AP, switch, gateway)
export const deviceMacSchema = z
    .string()
    .trim()
    .regex(/^[0-9A-Fa-f]{2}([:-][0-9A-Fa-f]{2}){5}$/, 'Invalid MAC address format. Expected "AA-BB-CC-DD-EE-FF" or "AA:BB:CC:DD:EE:FF".');

export const siteInputSchema = z.object({
    siteId: z
        .string()
        .min(1)
        .optional()
        .describe('Site ID to target. If omitted, uses the default site from OMADA_SITE_ID config. Use listSites to discover available site IDs.'),
    customHeaders: customHeadersSchema.describe(
        'Optional HTTP headers to include in the Omada API request (e.g. {"X-Custom-Header": "value"}). Rarely needed.'
    ),
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
        return JSON.stringify(sanitizeForLogs(value));
    } catch {
        return '[unserializable]';
    }
}

function sanitizeForLogs(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === 'string') {
        return isLikelySensitiveString(value) ? maskValue(value) : value;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => sanitizeForLogs(entry));
    }

    if (typeof value === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            sanitized[key] = isSensitiveKey(key) ? maskValue(entry) : sanitizeForLogs(entry);
        }
        return sanitized;
    }

    return value;
}

function isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return (
        normalized.includes('authorization') ||
        normalized.includes('token') ||
        normalized.includes('secret') ||
        normalized.includes('password') ||
        normalized.includes('cookie') ||
        normalized.includes('clientid') ||
        normalized.includes('client-id') ||
        normalized.includes('client_id') ||
        normalized.includes('customheaders')
    );
}

function isLikelySensitiveString(value: string): boolean {
    return value.length > 16 && /[A-Za-z0-9+/=._-]{16,}/.test(value);
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

export interface MutationSummary {
    action: string;
    target: string;
    siteId?: string;
    mode: 'apply' | 'dry-run';
    status: 'planned' | 'applied';
    summary: string;
    result?: unknown;
}

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

export function toMutationResult(summary: MutationSummary): CallToolResult {
    return toToolResult(summary);
}

export function wrapMutationToolHandler<Args extends z.ZodRawShape>(
    name: string,
    summary: (args: z.objectOutputType<Args, z.ZodTypeAny>, result: unknown, mode: 'apply' | 'dry-run') => MutationSummary,
    handler: (args: z.objectOutputType<Args, z.ZodTypeAny>, extra: ToolExtra) => Promise<unknown>
): (args: z.objectOutputType<Args, z.ZodTypeAny>, extra: ToolExtra) => Promise<CallToolResult> {
    return wrapToolHandler(name, async (args, extra) => {
        const mode = ((args as Record<string, unknown>).dryRun === true ? 'dry-run' : 'apply') as 'apply' | 'dry-run';
        const result = await handler(args, extra);
        const mutationSummary = summary(args, result, mode);
        logger.info('Mutation audit event', {
            tool: name,
            sessionId: extra.sessionId ?? 'unknown-session',
            mutation: safeSerialize(mutationSummary),
        });
        return toMutationResult(mutationSummary);
    });
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

export function createServer(): McpServer {
    const server = new McpServer({
        name: 'safe-omada-mcp',
        version: packageMetadata.version,
    });

    setupServerLogging(server);

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
