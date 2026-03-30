import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRestoreResultTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getRestoreResult',
        {
            description: 'Get the result of the most recent controller restore operation.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRestoreResult', async ({ customHeaders }) => toToolResult(await client.getRestoreResult(customHeaders)))
    );
}
