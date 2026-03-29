import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetTrafficStatsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getTrafficStats',
        {
            description:
                'Get traffic activity statistics for a site, including upload/download throughput data from the dashboard traffic activities endpoint.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getTrafficStats', async ({ siteId, customHeaders }) => toToolResult(await client.getWanUsageStats(siteId, customHeaders)))
    );
}
