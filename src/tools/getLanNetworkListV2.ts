import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetLanNetworkListV2Tool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLanNetworkListV2',
        {
            description:
                'Get the LAN network list using the v2 API. Returns richer VLAN and network data including subnet info and DHCP settings. Paginated.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getLanNetworkListV2', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getLanNetworkListV2(page, pageSize, siteId, customHeaders))
        )
    );
}
