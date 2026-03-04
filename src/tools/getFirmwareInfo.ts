import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        deviceMac: siteInputSchema.shape.siteId
            .unwrap()
            .describe('MAC address of the device (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find device MACs.'),
    })
    .required({ deviceMac: true });

export function registerGetFirmwareInfoTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getFirmwareInfo',
        {
            description:
                'Get the latest available firmware information for a device. Returns current firmware version, latest available version, and whether an upgrade is available. Use listDevices to get deviceMac values.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getFirmwareInfo', async ({ deviceMac, siteId, customHeaders }) =>
            toToolResult(await client.getFirmwareInfo(deviceMac, siteId, customHeaders))
        )
    );
}
