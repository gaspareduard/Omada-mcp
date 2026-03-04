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

export function registerGetApRadiosTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApRadios',
        {
            description:
                'Get radio status for a specific access point: 2.4GHz and 5GHz band config, channel, TX power, channel utilization, and associated client count per radio. Use listDevices to get the apMac.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getApRadios', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getApRadios(apMac, siteId, customHeaders))
        )
    );
}
