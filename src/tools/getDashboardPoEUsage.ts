import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDashboardPoEUsageTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDashboardPoEUsage',
        {
            description: 'Get PoE (Power over Ethernet) usage statistics for a site, showing power consumption per switch.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getDashboardPoEUsage', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getDashboardPoEUsage(siteId, customHeaders))
        )
    );
}
