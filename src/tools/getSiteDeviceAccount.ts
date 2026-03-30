import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteDeviceAccountTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSiteDeviceAccount',
        {
            description: 'Get the device account settings for a site, including shared credentials used for device access.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSiteDeviceAccount', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getSiteDeviceAccount(siteId, customHeaders))
        )
    );
}
