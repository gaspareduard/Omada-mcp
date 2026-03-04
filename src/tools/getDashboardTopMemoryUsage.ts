import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDashboardTopMemoryUsageTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDashboardTopMemoryUsage',
        {
            description: 'Get the top devices by memory usage for a site, useful for identifying memory-constrained devices.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getDashboardTopMemoryUsage', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getDashboardTopMemoryUsage(siteId, customHeaders))
        )
    );
}
