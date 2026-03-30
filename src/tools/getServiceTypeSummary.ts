import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetServiceTypeSummaryTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getServiceTypeSummary',
        {
            description: 'Get a summary of service type profiles for the site, including predefined and custom service counts.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getServiceTypeSummary', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getServiceTypeSummary(siteId, customHeaders))
        )
    );
}
