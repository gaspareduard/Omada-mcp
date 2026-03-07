import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetPortForwardingListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getPortForwardingList',
        {
            description:
                'Get a paginated page of NAT port forwarding rules for the site gateway. Returns the list of entries that map external ports to internal hosts for the requested page.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getPortForwardingList', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getPortForwardingListPage(page, pageSize, siteId, customHeaders))
        )
    );
}
