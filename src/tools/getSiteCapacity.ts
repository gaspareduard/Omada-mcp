import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteCapacityTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSiteCapacity',
        {
            description: 'Get site capacity settings including maximum device and client counts.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSiteCapacity', async ({ siteId, customHeaders }) => toToolResult(await client.getSiteCapacity(siteId, customHeaders)))
    );
}
