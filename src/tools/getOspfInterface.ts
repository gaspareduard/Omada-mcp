import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetOspfInterfaceTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getOspfInterface',
        {
            description: 'Get OSPF interface configuration for the site gateway.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getOspfInterface', async ({ siteId, customHeaders }) => toToolResult(await client.getOspfInterface(siteId, customHeaders)))
    );
}
