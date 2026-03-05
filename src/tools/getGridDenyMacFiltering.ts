import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridDenyMacFilteringTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridDenyMacFiltering',
        {
            description:
                'Get the MAC address deny-list entries (paginated). Clients on this list are blocked from accessing the network when MAC filtering is enabled.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('getGridDenyMacFiltering', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridDenyMacFiltering(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
