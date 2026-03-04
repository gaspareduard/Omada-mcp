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

export function registerGetSpeedTestResultsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSpeedTestResults',
        {
            description:
                'Get the last speed test results for an access point. Returns upload/download throughput measurements from the most recent speed test. Use triggerSpeedTest first to initiate a new test; this returns stored results.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSpeedTestResults', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getSpeedTestResults(apMac, siteId, customHeaders))
        )
    );
}
