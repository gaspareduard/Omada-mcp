import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetIptvSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getIptvSetting',
        {
            description: 'Get IPTV service configuration for the site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getIptvSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getIptvSetting(siteId, customHeaders)))
    );
}
