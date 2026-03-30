import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerListServiceTypeTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listServiceType',
        {
            description: 'List service type profiles (paginated). Returns both predefined and custom service types used in ACL and firewall rules.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('listServiceType', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.listServiceType(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
