import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteBackupResultTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSiteBackupResult',
        {
            description: 'Get the result of the most recent backup operation for a specific site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSiteBackupResult', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getSiteBackupResult(siteId, customHeaders))
        )
    );
}
