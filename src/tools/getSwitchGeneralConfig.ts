import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        switchMac: deviceMacSchema.describe('MAC address of the switch (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find switch MACs.'),
    })
    .required({ switchMac: true });

export function registerGetSwitchGeneralConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSwitchGeneralConfig',
        {
            description:
                'Get general configuration for a switch including device name, LED settings, LLDP settings, flow control, and other global switch parameters. Use listDevices to get switchMac values.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSwitchGeneralConfig', async ({ switchMac, siteId, customHeaders }) =>
            toToolResult(await client.getSwitchGeneralConfig(switchMac, siteId, customHeaders))
        )
    );
}
