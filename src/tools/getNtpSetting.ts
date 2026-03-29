import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetNtpSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getNtpSetting',
        {
            description: 'Get NTP server configuration and synchronisation status for the site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getNtpSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getNtpSetting(siteId, customHeaders)))
    );
}
