import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDashboardMostActiveEapsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDashboardMostActiveEaps',
        {
            description: 'Get the most active access points (EAPs) in a site, sorted by traffic volume.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getDashboardMostActiveEaps', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getDashboardMostActiveEaps(siteId, customHeaders))
        )
    );
}
