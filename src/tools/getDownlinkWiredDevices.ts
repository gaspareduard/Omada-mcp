import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetDownlinkWiredDevicesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDownlinkWiredDevices',
        {
            description:
                "Get wired downlink devices connected to an access point's LAN port. Returns a list of devices using the AP as a wired switch, including their MAC addresses and connection details. Useful for APs with built-in switch ports (e.g. EAP615-Wall).",
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getDownlinkWiredDevices', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getDownlinkWiredDevices(apMac, siteId, customHeaders))
        )
    );
}
