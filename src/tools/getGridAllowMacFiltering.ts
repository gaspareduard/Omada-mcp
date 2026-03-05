import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridAllowMacFilteringTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridAllowMacFiltering',
        {
            description:
                'Get the MAC address allow-list entries (paginated). Clients on this list are permitted access when MAC filtering is set to allow-list mode.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('getGridAllowMacFiltering', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridAllowMacFiltering(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
