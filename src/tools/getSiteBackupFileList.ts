import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteBackupFileListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSiteBackupFileList',
        {
            description: 'Get the list of available backup files for a specific site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSiteBackupFileList', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getSiteBackupFileList(siteId, customHeaders))
        )
    );
}
