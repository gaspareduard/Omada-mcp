import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetSitesApsTrunkSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSitesApsTrunkSetting',
        {
            description: 'Get trunk setting for an AP.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSitesApsTrunkSetting', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getSitesApsTrunkSetting(apMac, siteId, customHeaders))
        )
    );
}
