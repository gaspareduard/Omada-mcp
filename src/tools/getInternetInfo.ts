import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetInternetInfoTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getInternetInfo',
        {
            description: 'Get internet configuration information for a site, including WAN settings and connectivity details.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getInternetInfo', async ({ siteId, customHeaders }) => toToolResult(await client.getInternetInfo(siteId, customHeaders)))
    );
}
