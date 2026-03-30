import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetOspfNeighborsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getOspfNeighbors',
        {
            description: 'Get OSPF neighbor devices for the site gateway.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getOspfNeighbors', async ({ siteId, customHeaders }) => toToolResult(await client.getOspfNeighbors(siteId, customHeaders)))
    );
}
