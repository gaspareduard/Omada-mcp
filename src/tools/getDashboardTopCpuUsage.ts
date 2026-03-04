import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDashboardTopCpuUsageTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDashboardTopCpuUsage',
        {
            description: 'Get the top devices by CPU usage for a site, useful for identifying overloaded devices.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getDashboardTopCpuUsage', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getDashboardTopCpuUsage(siteId, customHeaders))
        )
    );
}
