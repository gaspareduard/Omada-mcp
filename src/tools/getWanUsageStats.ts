import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetWanUsageStatsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWanUsageStats',
        {
            description: 'Get WAN traffic usage statistics and activity data for the site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getWanUsageStats', async ({ siteId, customHeaders }) => toToolResult(await client.getWanUsageStats(siteId, customHeaders)))
    );
}
