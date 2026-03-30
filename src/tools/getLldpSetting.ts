import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetLldpSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLldpSetting',
        {
            description:
                'Get LLDP (Link Layer Discovery Protocol) global setting for the site. Shows whether LLDP is enabled and which TLVs are advertised.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getLldpSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getLldpSetting(siteId, customHeaders)))
    );
}
