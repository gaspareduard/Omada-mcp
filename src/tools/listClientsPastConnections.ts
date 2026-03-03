import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerListClientsPastConnectionsTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteId: z.string().optional().describe('Optional site ID. If not provided, uses the default site from configuration.'),
        ...createPaginationSchema(50),
        sortLastSeen: z
            .enum(['asc', 'desc'])
            .optional()
            .describe('Sort by last seen time. Values: asc or desc. When multiple sorts exist, first one takes effect.'),
        timeStart: z.number().int().optional().describe('Filter by time range start timestamp (milliseconds).'),
        timeEnd: z.number().int().optional().describe('Filter by time range end timestamp (milliseconds).'),
        guest: z.boolean().optional().describe('Filter by guest status (true/false).'),
        searchKey: z.string().optional().describe('Fuzzy search by name, MAC address, or SSID.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'listClientsPastConnections',
        {
            description:
                'Get client past connection list with historical connection data. Returns information about clients that have previously connected to the network, including connection timestamps, traffic data, duration, and device details. Supports pagination, filtering by time range and guest status, sorting by last seen time, and fuzzy search by name/MAC/SSID.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listClientsPastConnections', async (args) =>
            toToolResult(
                await client.listClientsPastConnections(
                    {
                        siteId: args.siteId,
                        page: args.page,
                        pageSize: args.pageSize,
                        sortLastSeen: args.sortLastSeen,
                        timeStart: args.timeStart,
                        timeEnd: args.timeEnd,
                        guest: args.guest,
                        searchKey: args.searchKey,
                    },
                    args.customHeaders
                )
            )
        )
    );
}
