import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = { customHeaders: customHeadersSchema };

export function registerGetUpgradeOverviewTryBetaTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUpgradeOverviewTryBeta',
        {
            description: 'Get the try-beta firmware switch status for the controller.',
            inputSchema,
        },
        wrapToolHandler('getUpgradeOverviewTryBeta', async ({ customHeaders }) => toToolResult(await client.getUpgradeOverviewTryBeta(customHeaders)))
    );
}
