import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListStaticRoutesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listStaticRoutes',
        {
            description:
                '[DEPRECATED] Use getGridStaticRouting instead. Same GET .../routing/static-routings endpoint. Note: listStaticRoutes aggregates results across all pages, while getGridStaticRouting returns a single paginated page (requires page/pageSize). When migrating, be sure to iterate pages to collect all static routing rules. List static routing rules configured for a site: destination network, next-hop IP, interface, metric, and enabled state.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listStaticRoutes', async ({ siteId, customHeaders }) => toToolResult(await client.listStaticRoutes(siteId, customHeaders)))
    );
}
