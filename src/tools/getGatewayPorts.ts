import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        gatewayMac: siteInputSchema.shape.siteId
            .unwrap()
            .describe('MAC address of the gateway (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find the gateway MAC.'),
    })
    .required({ gatewayMac: true });

export function registerGetGatewayPortsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGatewayPorts',
        {
            description:
                'Get all WAN and LAN port details for a specific gateway: link status, speed, IP address, bytes in/out, and port profile. More detailed than getGatewayWanStatus or getGatewayLanStatus. Use listDevices to get the gatewayMac.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGatewayPorts', async ({ gatewayMac, siteId, customHeaders }) =>
            toToolResult(await client.getGatewayPorts(gatewayMac, siteId, customHeaders))
        )
    );
}
