import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetUpnpSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUpnpSetting',
        {
            description: 'Get UPnP (Universal Plug and Play) setting for the site. Shows whether UPnP port mapping is enabled on the gateway.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getUpnpSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getUpnpSetting(siteId, customHeaders)))
    );
}
