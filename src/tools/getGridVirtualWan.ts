import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetGridVirtualWanTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridVirtualWan',
        {
            description:
                'Get virtual WAN list for the site gateway. Virtual WANs allow multiple logical WAN connections over a single physical port. Paginated.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGridVirtualWan', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridVirtualWan(page, pageSize, siteId, customHeaders))
        )
    );
}
