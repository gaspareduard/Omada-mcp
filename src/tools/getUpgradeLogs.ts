import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = { ...createPaginationSchema(), customHeaders: customHeadersSchema };

export function registerGetUpgradeLogsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUpgradeLogs',
        {
            description: 'Get firmware upgrade logs showing the history of upgrade operations performed on devices.',
            inputSchema,
        },
        wrapToolHandler('getUpgradeLogs', async ({ page, pageSize, customHeaders }) =>
            toToolResult(await client.getUpgradeLogs(page ?? 1, pageSize ?? 10, customHeaders))
        )
    );
}
