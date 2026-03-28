import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetApQosConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApQosConfig',
        {
            description: 'Get QoS configuration for a specific access point.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getApQosConfig', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getApQosConfig(apMac, siteId, customHeaders))
        )
    );
}
