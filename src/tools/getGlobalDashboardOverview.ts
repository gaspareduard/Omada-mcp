import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetGlobalDashboardOverviewTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getGlobalDashboardOverview',
        {
            description:
                'Get global controller dashboard overview without client data, showing device counts, site counts, and network health summary.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGlobalDashboardOverview', async ({ customHeaders }) =>
            toToolResult(await client.getGlobalDashboardOverview(customHeaders))
        )
    );
}
