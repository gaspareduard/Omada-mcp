import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetPoeScheduleListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getPoeScheduleList',
        {
            description: 'Get the list of PoE (Power over Ethernet) schedules configured for a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getPoeScheduleList', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getPoeScheduleList(siteId, customHeaders))
        )
    );
}
