import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetPortForwardingStatusTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        type: z.enum(['User', 'UPnP']).describe('Port forwarding type: User (manually configured) or UPnP (automatically configured)'),
        siteId: z.string().min(1).describe('Site ID (required)'),
        ...createPaginationSchema(10),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getPortForwardingStatus',
        {
            description:
                'Get port forwarding status and rules for a site. Retrieves either User-configured or UPnP-discovered port forwarding rules. Both page and pageSize parameters are required by the API. Call this tool twice (once with type="User" and once with type="UPnP") to get complete port forwarding information.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getPortForwardingStatus', async ({ type, siteId, page = 1, pageSize = 10, customHeaders }) =>
            toToolResult(await client.getPortForwardingStatus(type, siteId, page, pageSize, customHeaders))
        )
    );
}
