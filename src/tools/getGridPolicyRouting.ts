import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetGridPolicyRoutingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridPolicyRouting',
        {
            description:
                'Get policy routing rules for the site gateway. Policy routes direct traffic based on source IP, destination IP, or protocol. Paginated.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGridPolicyRouting', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridPolicyRouting(page, pageSize, siteId, customHeaders))
        )
    );
}
