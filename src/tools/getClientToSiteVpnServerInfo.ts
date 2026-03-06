import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetClientToSiteVpnServerInfoTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        vpnId: z.string().min(1).describe('ID of the client-to-site VPN server to retrieve details for.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getClientToSiteVpnServerInfo',
        {
            description:
                'Get detailed configuration for a specific client-to-site VPN server by ID, including protocol, port, authentication type, and allowed client settings.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getClientToSiteVpnServerInfo', async ({ vpnId, siteId, customHeaders }) =>
            toToolResult(await client.getClientToSiteVpnServerInfo(vpnId, siteId, customHeaders))
        )
    );
}
