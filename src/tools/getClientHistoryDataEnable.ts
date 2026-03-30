import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetClientHistoryDataEnableTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getClientHistoryDataEnable',
        {
            description: 'Get the client history data collection enable/disable setting for the controller.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getClientHistoryDataEnable', async ({ customHeaders }) =>
            toToolResult(await client.getClientHistoryDataEnable(customHeaders))
        )
    );
}
