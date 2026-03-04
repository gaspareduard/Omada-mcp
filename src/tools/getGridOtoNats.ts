import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetGridOtoNatsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridOtoNats',
        {
            description: 'Get 1:1 NAT rules for the site gateway. Each rule maps a public IP directly to a private host IP. Paginated.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGridOtoNats', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridOtoNats(page, pageSize, siteId, customHeaders))
        )
    );
}
