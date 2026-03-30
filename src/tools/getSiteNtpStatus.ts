import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteNtpStatusTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSiteNtpStatus',
        {
            description: 'Get NTP server status and configuration for a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSiteNtpStatus', async ({ siteId, customHeaders }) => toToolResult(await client.getSiteNtpStatus(siteId, customHeaders)))
    );
}
