import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridGatewayRuleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridGatewayRule',
        {
            description: 'Get the URL filter gateway rules (paginated). Returns URL-based filtering rules applied to traffic through the gateway.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('getGridGatewayRule', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridGatewayRule(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
