import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        switchMac: deviceMacSchema.describe('MAC address of the switch (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find switch MACs.'),
        customHeaders: customHeadersSchema,
    })
    .required({ switchMac: true });

export function registerGetSwitchVlanInterfaceTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSwitchVlanInterface',
        {
            description: 'Get VLAN interface configuration for a specific switch. Requires `switchMac`.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSwitchVlanInterface', async ({ switchMac, siteId, customHeaders }) =>
            toToolResult(await client.getSwitchVlanInterface(switchMac, siteId, customHeaders))
        )
    );
}
