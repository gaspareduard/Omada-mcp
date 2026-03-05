import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridClientHistoryTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        clientMac: z.string().min(1).describe('MAC address of the client to retrieve history for.'),
        ...createPaginationSchema(),
        searchKey: z.string().optional().describe('Search keyword to filter history entries.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getGridClientHistory',
        {
            description:
                'Get per-client connection history (paginated). Returns past connection sessions for a specific client including timestamps, SSID/network, traffic, and authentication type.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGridClientHistory', async ({ clientMac, page, pageSize, searchKey, siteId, customHeaders }) =>
            toToolResult(await client.getGridClientHistory(clientMac, page ?? 1, pageSize ?? 10, searchKey, siteId, customHeaders))
        )
    );
}
