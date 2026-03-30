import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSiteDetail',
        {
            description: 'Get detailed information about a site, including name, region, timezone, and configuration settings.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSiteDetail', async ({ siteId, customHeaders }) => toToolResult(await client.getSiteDetail(siteId, customHeaders)))
    );
}
