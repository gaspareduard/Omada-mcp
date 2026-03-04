import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetSnmpSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSnmpSetting',
        {
            description: 'Get SNMP configuration for the site. Returns SNMP version, community string, and enabled state.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSnmpSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getSnmpSetting(siteId, customHeaders)))
    );
}
