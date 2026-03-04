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

export function registerGetApDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApDetail',
        {
            description:
                'Fetch full configuration and status for a specific access point: model, firmware, CPU/memory, connected clients count, SSIDs, uptime, and mesh status. Use listDevices to get the apMac.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getApDetail', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getApDetail(apMac, siteId, customHeaders))
        )
    );
}
