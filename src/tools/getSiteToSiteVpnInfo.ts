import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteToSiteVpnInfoTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        vpnId: z.string().min(1).describe('ID of the site-to-site VPN to retrieve details for.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getSiteToSiteVpnInfo',
        {
            description:
                'Get detailed information about a specific site-to-site VPN by ID, including tunnel type, remote gateway, authentication method, and current status.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSiteToSiteVpnInfo', async ({ vpnId, siteId, customHeaders }) =>
            toToolResult(await client.getSiteToSiteVpnInfo(vpnId, siteId, customHeaders))
        )
    );
}
