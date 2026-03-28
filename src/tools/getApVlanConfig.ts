import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetApVlanConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApVlanConfig',
        {
            description:
                "Get VLAN configuration for an access point. Returns the AP's management VLAN and per-SSID VLAN tagging settings. Useful for verifying network segmentation on wireless infrastructure.",
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getApVlanConfig', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getApVlanConfig(apMac, siteId, customHeaders))
        )
    );
}
