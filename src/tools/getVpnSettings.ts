import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetVpnSettingsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getVpnSettings',
        {
            description: 'Get VPN configuration settings for a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getVpnSettings', async ({ siteId, customHeaders }) => toToolResult(await client.getVpnSettings(siteId, customHeaders)))
    );
}
