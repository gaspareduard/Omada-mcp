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

export function registerGetRFScanResultTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRFScanResult',
        {
            description:
                '[DEPRECATED] Get the last RF scan results for an access point. This endpoint is marked deprecated in the Omada OpenAPI spec. Returns detected neighbouring networks, per-channel utilization, interference levels, and RSSI data. Use triggerRfScan first to initiate a fresh scan; this returns the most recent stored results.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRFScanResult', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getRFScanResult(apMac, siteId, customHeaders))
        )
    );
}
