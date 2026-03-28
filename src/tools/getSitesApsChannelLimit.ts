import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetSitesApsChannelLimitTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSitesApsChannelLimit',
        {
            description: 'Get channel limit config for an AP.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSitesApsChannelLimit', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getSitesApsChannelLimit(apMac, siteId, customHeaders))
        )
    );
}
