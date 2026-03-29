import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetBandwidthCtrlDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getBandwidthCtrlDetail',
        {
            description: 'Get gateway bandwidth control detail settings for a site, including per-IP and per-SSID bandwidth limits.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getBandwidthCtrlDetail', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getBandwidthCtrlDetail(siteId, customHeaders))
        )
    );
}
