import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDataRetentionTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getDataRetention',
        {
            description: 'Get the data retention settings for the controller, including how long logs and statistics are stored.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getDataRetention', async ({ customHeaders }) => toToolResult(await client.getDataRetention(customHeaders)))
    );
}
