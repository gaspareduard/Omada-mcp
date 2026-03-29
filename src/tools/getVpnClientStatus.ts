import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetVpnClientStatusTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getVpnClientStatus',
        {
            description: 'Get the status of client-to-site VPN clients connected to the site, including connection state, assigned IP, and duration.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getVpnClientStatus', async ({ siteId, customHeaders }) =>
            toToolResult(await client.listClientToSiteVpnClients(siteId, customHeaders))
        )
    );
}
