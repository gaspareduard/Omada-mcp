import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        gatewayMac: deviceMacSchema.describe('MAC address of the gateway (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find gateway MACs.'),
    })
    .required({ gatewayMac: true });

export function registerGetSitesHealthGatewaysWansDetailsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSitesHealthGatewaysWansDetails',
        {
            description: 'Get WAN port health details for a gateway.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSitesHealthGatewaysWansDetails', async ({ gatewayMac, siteId, customHeaders }) =>
            toToolResult(await client.getSitesHealthGatewaysWansDetails(gatewayMac, siteId, customHeaders))
        )
    );
}
