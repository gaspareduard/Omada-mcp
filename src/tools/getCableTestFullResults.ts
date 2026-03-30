import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        switchMac: deviceMacSchema.describe('MAC address of the switch (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find switch MACs.'),
    })
    .required({ switchMac: true });

export function registerGetCableTestFullResultsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getCableTestFullResults',
        {
            description:
                'Get full cable test results for all ports on a switch. Returns detailed per-port diagnostic data including cable status (OK/open/short), estimated cable length, and fault location. More detailed than getCableTestLogs.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getCableTestFullResults', async ({ switchMac, siteId, customHeaders }) =>
            toToolResult(await client.getCableTestFullResults(switchMac, siteId, customHeaders))
        )
    );
}
