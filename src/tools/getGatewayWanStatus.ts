import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        gatewayMac: deviceMacSchema.describe('MAC address of the gateway (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find the gateway MAC.'),
    })
    .required({ gatewayMac: true });

export function registerGetGatewayWanStatusTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGatewayWanStatus',
        {
            description:
                'Get the WAN port status and connectivity information for a specific gateway. Returns WAN IP, DNS, uptime, link speed, TX/RX rates, and connection type for each WAN port. Use listDevices to find the gatewayMac.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGatewayWanStatus', async ({ gatewayMac, siteId, customHeaders }) =>
            toToolResult(await client.getGatewayWanStatus(gatewayMac, siteId, customHeaders))
        )
    );
}
