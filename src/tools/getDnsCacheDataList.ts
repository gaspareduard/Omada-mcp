import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetDnsCacheDataListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDnsCacheDataList',
        {
            description: 'Get the DNS cache data list for the site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getDnsCacheDataList', async ({ siteId, page, pageSize, customHeaders }) =>
            toToolResult(await client.getDnsCacheDataList(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
