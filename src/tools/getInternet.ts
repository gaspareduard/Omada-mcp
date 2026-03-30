import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetInternetTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getInternet',
        {
            description:
                'Get full WAN/Internet configuration for the site gateway. Returns all WAN settings including connection type, IP, DNS, and advanced options.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getInternet', async ({ siteId, customHeaders }) => toToolResult(await client.getInternet(siteId, customHeaders)))
    );
}
