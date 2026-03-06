import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridIpsecFailoverTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridIpsecFailover',
        {
            description:
                'Get IPsec failover configuration (paginated). Returns failover rules that define backup tunnel behavior when a primary IPsec tunnel goes down.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('getGridIpsecFailover', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridIpsecFailover(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
