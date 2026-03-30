import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        stackId: siteInputSchema.shape.siteId.unwrap().describe('Stack ID of the switch stack. Use getSwitchStackDetail to find the stackId.'),
    })
    .required({ stackId: true });

export function registerGetOswStackLagListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getOswStackLagList',
        {
            description:
                'Get Link Aggregation Group (LAG) list for a switch stack. Returns configured LAG/trunk groups including member ports, load balancing mode, and status. Use getSwitchStackDetail to get the stackId.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getOswStackLagList', async ({ stackId, siteId, customHeaders }) =>
            toToolResult(await client.getOswStackLagList(stackId, siteId, customHeaders))
        )
    );
}
