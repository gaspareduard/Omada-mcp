import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetWanNatConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWanNatConfig',
        {
            description: 'Get one-to-one NAT configuration (WAN NAT rules) for the site gateway.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getWanNatConfig', async ({ siteId, page, pageSize, customHeaders }) =>
            toToolResult(await client.getWanNatConfig(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
