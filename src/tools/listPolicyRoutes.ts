import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerListPolicyRoutesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listPolicyRoutes',
        {
            description:
                'List policy routing rules for the site gateway. Policy routes direct traffic based on source IP, destination, or protocol — useful for multi-WAN environments.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listPolicyRoutes', async ({ siteId, customHeaders }) => toToolResult(await client.listPolicyRoutes(siteId, customHeaders)))
    );
}
