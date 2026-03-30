import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    vpnId: z
        .string()
        .min(1)
        .describe('ID of the client-to-site VPN server to retrieve users for. Use listClientToSiteVpnServers to find available VPN server IDs.'),
    ...siteInputSchema.shape,
});

export function registerGetVpnUserDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getVpnUserDetail',
        {
            description: 'Get the users associated with a specific client-to-site VPN server by VPN server ID.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getVpnUserDetail', async ({ vpnId, siteId, customHeaders }) =>
            toToolResult(await client.getVpnUserDetail(vpnId, siteId, customHeaders))
        )
    );
}
