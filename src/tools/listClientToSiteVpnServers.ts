import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListClientToSiteVpnServersTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listClientToSiteVpnServers',
        {
            description: 'List all client-to-site VPN server configurations on the site, including server type, IP, and authentication settings.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listClientToSiteVpnServers', async ({ siteId, customHeaders }) =>
            toToolResult(await client.listClientToSiteVpnServers(siteId, customHeaders))
        )
    );
}
