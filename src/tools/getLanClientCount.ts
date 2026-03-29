import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetLanClientCountTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLanClientCount',
        {
            description: 'Get client distribution breakdown across LAN segments (wired, wireless, guest) for the site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getLanClientCount', async ({ siteId, customHeaders }) => toToolResult(await client.getLanClientCount(siteId, customHeaders)))
    );
}
