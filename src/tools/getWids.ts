import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetWidsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWids',
        {
            description: 'Get Wireless Intrusion Detection System (WIDS) information for a site, including detected attacks and rogue devices.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getWids', async ({ siteId, customHeaders }) => toToolResult(await client.getWids(siteId, customHeaders)))
    );
}
