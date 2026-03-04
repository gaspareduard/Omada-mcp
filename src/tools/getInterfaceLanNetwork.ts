import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
    type: z.number().int().min(0).max(1).optional().describe('Interface type filter: 0 = WAN, 1 = LAN. Omit to return all.'),
});

export function registerGetInterfaceLanNetworkTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getInterfaceLanNetwork',
        {
            description:
                'Get interface-level LAN network bindings. Optionally filter by type (0=WAN, 1=LAN). Returns per-interface VLAN assignments and network configuration.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getInterfaceLanNetwork', async ({ type, siteId, customHeaders }) =>
            toToolResult(await client.getInterfaceLanNetwork(type, siteId, customHeaders))
        )
    );
}
