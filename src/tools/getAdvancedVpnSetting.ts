import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAdvancedVpnSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAdvancedVpnSetting',
        {
            description: 'Get advanced VPN configuration settings for a site, including general VPN parameters and default settings.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getAdvancedVpnSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getVpnSettings(siteId, customHeaders))
        )
    );
}
