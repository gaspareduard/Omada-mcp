import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = { customHeaders: customHeadersSchema };

export function registerGetUpgradeOverviewCriticalTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUpgradeOverviewCritical',
        {
            description: 'Get the number of critical firmware upgrades available across managed devices.',
            inputSchema,
        },
        wrapToolHandler('getUpgradeOverviewCritical', async ({ customHeaders }) =>
            toToolResult(await client.getUpgradeOverviewCritical(customHeaders))
        )
    );
}
