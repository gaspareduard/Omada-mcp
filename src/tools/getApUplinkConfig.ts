import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: siteInputSchema.shape.siteId
            .unwrap()
            .describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetApUplinkConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApUplinkConfig',
        {
            description:
                'Get the uplink configuration for an access point. Returns uplink mode (wired/wireless mesh), preferred uplink settings, and failover configuration. Useful for understanding mesh topology and wired uplink assignments.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getApUplinkConfig', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getApUplinkConfig(apMac, siteId, customHeaders))
        )
    );
}
