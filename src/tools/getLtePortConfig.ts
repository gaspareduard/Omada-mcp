import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetLtePortConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLtePortConfig',
        {
            description: 'Get LTE/cellular WAN port configuration for the site gateway.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getLtePortConfig', async ({ siteId, customHeaders }) => toToolResult(await client.getLtePortConfig(siteId, customHeaders)))
    );
}
