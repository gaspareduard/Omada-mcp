import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListSiteToSiteVpnsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listSiteToSiteVpns',
        {
            description:
                'List site-to-site VPN configurations: tunnel name, remote IP, status, protocol (IPsec/OpenVPN/WireGuard), and local/remote subnets.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listSiteToSiteVpns', async ({ siteId, customHeaders }) =>
            toToolResult(await client.listSiteToSiteVpns(siteId, customHeaders))
        )
    );
}
