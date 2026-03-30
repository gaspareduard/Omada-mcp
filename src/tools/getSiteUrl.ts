import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteUrlTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSiteUrl',
        {
            description: 'Get the URL associated with a site for OpenAPI access.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSiteUrl', async ({ siteId, customHeaders }) => toToolResult(await client.getSiteUrl(siteId, customHeaders)))
    );
}
