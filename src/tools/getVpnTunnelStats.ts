import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetVpnTunnelStatsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getVpnTunnelStats',
        {
            description: 'Get VPN tunnel statistics for a site, including active tunnels, traffic, and connection status.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getVpnTunnelStats', async ({ siteId, customHeaders }) => toToolResult(await client.getVpnTunnelStats(siteId, customHeaders)))
    );
}
