import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetStaticRoutingInterfaceListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getStaticRoutingInterfaceList',
        {
            description:
                'Get the list of available interfaces for static routing. Use this to discover valid next-hop interface names when configuring static routes.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getStaticRoutingInterfaceList', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getStaticRoutingInterfaceList(siteId, customHeaders))
        )
    );
}
