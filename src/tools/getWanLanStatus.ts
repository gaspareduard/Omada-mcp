import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetWanLanStatusTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWanLanStatus',
        {
            description: 'Get the WAN and LAN connectivity status for a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getWanLanStatus', async ({ siteId, customHeaders }) => toToolResult(await client.getWanLanStatus(siteId, customHeaders)))
    );
}
