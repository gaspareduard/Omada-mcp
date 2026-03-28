import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        switchMac: deviceMacSchema.describe('MAC address of the switch (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find switch MACs.'),
    })
    .required({ switchMac: true });

export function registerGetSitesSwitchesEsGeneralConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSitesSwitchesEsGeneralConfig',
        {
            description: 'Get easy managed switch general config.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSitesSwitchesEsGeneralConfig', async ({ switchMac, siteId, customHeaders }) =>
            toToolResult(await client.getSitesSwitchesEsGeneralConfig(switchMac, siteId, customHeaders))
        )
    );
}
