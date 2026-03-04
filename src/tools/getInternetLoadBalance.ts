import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetInternetLoadBalanceTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getInternetLoadBalance',
        {
            description:
                'Get WAN load balancing configuration for the site gateway. Returns load balancing mode (failover/load balance) and WAN port weights.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getInternetLoadBalance', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getInternetLoadBalance(siteId, customHeaders))
        )
    );
}
