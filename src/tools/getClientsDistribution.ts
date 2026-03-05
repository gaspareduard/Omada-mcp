import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetClientsDistributionTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getClientsDistribution',
        {
            description:
                'Get client count distribution by connection type and band (wired, 2.4GHz, 5GHz, 6GHz). Useful for understanding the network composition at a glance.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getClientsDistribution', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getClientsDistribution(siteId, customHeaders))
        )
    );
}
