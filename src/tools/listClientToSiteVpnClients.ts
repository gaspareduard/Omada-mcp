import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListClientToSiteVpnClientsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listClientToSiteVpnClients',
        {
            description: 'List all client-to-site VPN client configurations on the site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listClientToSiteVpnClients', async ({ siteId, customHeaders }) =>
            toToolResult(await client.listClientToSiteVpnClients(siteId, customHeaders))
        )
    );
}
