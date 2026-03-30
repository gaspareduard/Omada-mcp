import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetOspfProcessTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getOspfProcess',
        {
            description: 'Get OSPF process configuration for the site gateway.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getOspfProcess', async ({ siteId, customHeaders }) => toToolResult(await client.getOspfProcess(siteId, customHeaders)))
    );
}
