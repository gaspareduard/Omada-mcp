import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDashboardMostActiveSwitchesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDashboardMostActiveSwitches',
        {
            description: 'Get the most active switches in a site, sorted by traffic volume.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getDashboardMostActiveSwitches', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getDashboardMostActiveSwitches(siteId, customHeaders))
        )
    );
}
