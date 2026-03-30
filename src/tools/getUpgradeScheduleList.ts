import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetUpgradeScheduleListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUpgradeScheduleList',
        {
            description: 'Get the list of firmware upgrade schedules configured for a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getUpgradeScheduleList', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getUpgradeScheduleList(siteId, customHeaders))
        )
    );
}
