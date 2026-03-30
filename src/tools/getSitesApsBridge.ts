import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        apMac: deviceMacSchema.describe('MAC address of the access point (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find AP MACs.'),
    })
    .required({ apMac: true });

export function registerGetSitesApsBridgeTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSitesApsBridge',
        {
            description: 'Get P2P bridge config for an AP.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSitesApsBridge', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getSitesApsBridge(apMac, siteId, customHeaders))
        )
    );
}
