import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    vpnId: z.string().min(1).describe('ID of the site-to-site VPN tunnel to retrieve. Use getIpsecTunnelList to find available VPN IDs.'),
    ...siteInputSchema.shape,
});

export function registerGetIpsecTunnelDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getIpsecTunnelDetail',
        {
            description:
                'Get detailed configuration for a specific site-to-site VPN (IPsec) tunnel by ID, including authentication, encryption, and network settings.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getIpsecTunnelDetail', async ({ vpnId, siteId, customHeaders }) =>
            toToolResult(await client.getSiteToSiteVpnInfo(vpnId, siteId, customHeaders))
        )
    );
}
