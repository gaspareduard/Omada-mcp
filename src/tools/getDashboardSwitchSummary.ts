import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDashboardSwitchSummaryTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDashboardSwitchSummary',
        {
            description:
                'Get switch summary for a site dashboard: total switch count, total ports, active ports, PoE budget used vs available, and aggregate bandwidth.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getDashboardSwitchSummary', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getDashboardSwitchSummary(siteId, customHeaders))
        )
    );
}
