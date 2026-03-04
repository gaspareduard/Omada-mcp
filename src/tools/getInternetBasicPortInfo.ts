import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetInternetBasicPortInfoTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getInternetBasicPortInfo',
        {
            description:
                'Get WAN port summary / basic info for the site gateway. Returns a concise view of WAN port status, connection type, and IP addresses.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getInternetBasicPortInfo', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getInternetBasicPortInfo(siteId, customHeaders))
        )
    );
}
