import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetDnsCacheSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDnsCacheSetting',
        {
            description: 'Get DNS cache setting for the site gateway. Shows whether DNS caching is enabled and the cache TTL configuration.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getDnsCacheSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getDnsCacheSetting(siteId, customHeaders))
        )
    );
}
