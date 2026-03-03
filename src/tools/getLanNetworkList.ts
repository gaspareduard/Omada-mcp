import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetLanNetworkListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLanNetworkList',
        {
            description: 'Get the list of LAN networks configured in a site, including VLAN settings, IP ranges, and DHCP configuration.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getLanNetworkList', async ({ siteId, customHeaders }) => toToolResult(await client.getLanNetworkList(siteId, customHeaders)))
    );
}
