import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = { ...createPaginationSchema(), customHeaders: customHeadersSchema };

export function registerGetGridAutoCheckUpgradeTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridAutoCheckUpgrade',
        {
            description:
                'Get the auto-check upgrade plan list showing scheduled firmware upgrade checks across devices. Useful for auditing upgrade schedules and identifying devices due for automatic firmware updates.',
            inputSchema,
        },
        wrapToolHandler('getGridAutoCheckUpgrade', async ({ page, pageSize, customHeaders }) =>
            toToolResult(await client.getGridAutoCheckUpgrade(page ?? 1, pageSize ?? 10, customHeaders))
        )
    );
}
