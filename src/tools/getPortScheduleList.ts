import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetPortScheduleListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getPortScheduleList',
        {
            description: 'Get the list of port schedules configured for a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getPortScheduleList', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getPortScheduleList(siteId, customHeaders))
        )
    );
}
