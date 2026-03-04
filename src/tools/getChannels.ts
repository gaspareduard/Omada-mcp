import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetChannelsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getChannels',
        {
            description:
                'Get channel distribution and utilization across all APs. Shows which WiFi channels (2.4 GHz, 5 GHz, 6 GHz) are in use, how many APs are on each channel, and channel congestion. Useful for diagnosing interference and planning channel assignments.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getChannels', async ({ siteId, customHeaders }) => toToolResult(await client.getChannels(siteId, customHeaders)))
    );
}
