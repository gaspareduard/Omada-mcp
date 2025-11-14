import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const portForwardingSchema = z.object({
    type: z.enum(['User', 'UPnP']).describe('Port forwarding type: User (manually configured) or UPnP (automatically configured)'),
    siteId: z.string().min(1).optional(),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(100).optional().default(10),
});

export function registerGetPortForwardingStatusTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getPortForwardingStatus',
        {
            description:
                'Get port forwarding status and rules for a site. Retrieves either User-configured or UPnP-discovered port forwarding rules. Call this tool twice (once with type="User" and once with type="UPnP") to get complete port forwarding information.',
            inputSchema: portForwardingSchema.shape,
        },
        wrapToolHandler('getPortForwardingStatus', async ({ type, siteId, page, pageSize }) =>
            toToolResult(await client.getPortForwardingStatus(type, siteId, page, pageSize))
        )
    );
}
