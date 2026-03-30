import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetBackupResultTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getBackupResult',
        {
            description: 'Get the result of the most recent controller backup operation.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getBackupResult', async ({ customHeaders }) => toToolResult(await client.getBackupResult(customHeaders)))
    );
}
