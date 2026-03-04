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

export function registerGetRadiosConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRadiosConfig',
        {
            description:
                'Get per-radio configuration for an access point. Returns settings for each radio (2.4GHz, 5GHz, 6GHz) including band, channel, transmit power, channel width, and enabled SSIDs. Use getApRadios for runtime radio status; this returns configuration.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRadiosConfig', async ({ apMac, siteId, customHeaders }) =>
            toToolResult(await client.getRadiosConfig(apMac, siteId, customHeaders))
        )
    );
}
