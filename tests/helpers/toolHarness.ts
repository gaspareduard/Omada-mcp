import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import type { ToolExtra } from '../../src/server/common.js';

export function toolHarness(
    register: (server: McpServer, client: OmadaClient) => void,
    client: object
): {
    invoke: (args?: Record<string, unknown>) => Promise<Record<string, unknown>>;
    schema: () => z.ZodObject<z.ZodRawShape>;
} {
    let shape: z.ZodRawShape = {};
    let handler: (args: Record<string, unknown>, extra: ToolExtra) => Promise<CallToolResult>;
    register(
        {
            registerTool(_name: string, config: { inputSchema: z.ZodRawShape }, callback: typeof handler) {
                shape = config.inputSchema;
                handler = callback;
            },
        } as unknown as McpServer,
        client as OmadaClient
    );
    return {
        schema: () => z.object(shape),
        invoke: async (args = {}) => {
            const result = await handler(z.object(shape).parse(args), { sessionId: 'test' } as ToolExtra);
            return JSON.parse((result.content[0] as { text: string }).text) as Record<string, unknown>;
        },
    };
}
