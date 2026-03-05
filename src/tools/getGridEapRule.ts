import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridEapRuleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridEapRule',
        {
            description: 'Get the URL filter AP rules (paginated). Returns URL-based filtering rules applied to wireless clients via access points.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('getGridEapRule', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridEapRule(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
