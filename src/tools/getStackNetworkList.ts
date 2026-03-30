import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema
    .extend({
        stackId: siteInputSchema.shape.siteId.unwrap().describe('Stack ID of the switch stack. Use getSwitchStackDetail to find the stackId.'),
        ...createPaginationSchema(),
    })
    .required({ stackId: true });

export function registerGetStackNetworkListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getStackNetworkList',
        {
            description:
                'Get the VLAN network list for a switch stack. Returns VLAN interface assignments across all stack members. Use getSwitchStackDetail to get the stackId.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getStackNetworkList', async ({ stackId, page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getStackNetworkList(stackId, page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
