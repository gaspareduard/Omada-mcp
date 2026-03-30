import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetPortalProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getPortalProfile',
        {
            description:
                'Get portal (captive portal) profiles for a site, listing configured hotspot portals with authentication methods and customization settings.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getPortalProfile', async ({ siteId, customHeaders }) => toToolResult(await client.getPortalProfile(siteId, customHeaders)))
    );
}
