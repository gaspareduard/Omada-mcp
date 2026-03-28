import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetSitesApsPowerSavingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSitesApsPowerSaving',
        {
            description: 'Get power saving config for an AP.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSitesApsPowerSaving', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getSitesApsPowerSaving(apMac, siteId, customHeaders))
        )
    );
}
