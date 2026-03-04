import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema
    .extend({
        switchMac: siteInputSchema.shape.siteId
            .unwrap()
            .describe('MAC address of the switch (e.g. "AA-BB-CC-DD-EE-FF"). Use listDevices to find switch MACs.'),
        ...createPaginationSchema(),
    })
    .required({ switchMac: true });

export function registerListSwitchNetworksTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listSwitchNetworks',
        {
            description:
                'List VLAN network assignments for a switch. Returns which VLANs are assigned to which ports, including tagged and untagged configurations. Use listDevices to get switchMac values.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listSwitchNetworks', async ({ switchMac, page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.listSwitchNetworks(switchMac, page, pageSize, siteId, customHeaders))
        )
    );
}
