import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetMeshStatisticsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMeshStatistics',
        {
            description:
                'Get mesh link statistics for an access point. Returns wireless backhaul link quality, signal strength, throughput, and hop count for mesh-connected APs. Useful for diagnosing mesh network performance.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getMeshStatistics', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getMeshStatistics(apMac, siteId, customHeaders))
        )
    );
}
