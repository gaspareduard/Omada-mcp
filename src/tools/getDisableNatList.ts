import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetDisableNatListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDisableNatList',
        {
            description: 'Get the list of wired networks with NAT disabled for the site gateway.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getDisableNatList', async ({ siteId, page, pageSize, customHeaders }) =>
            toToolResult(await client.getDisableNatList(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
