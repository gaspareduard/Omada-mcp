import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerListSiteThreatManagementTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(100),
        siteId: z.string().min(1).optional(),
        startTime: z.number().int().optional().describe('Start time as Unix timestamp in milliseconds'),
        endTime: z.number().int().optional().describe('End time as Unix timestamp in milliseconds'),
        searchKey: z.string().optional().describe('Search keyword for filtering threats'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'listSiteThreatManagement',
        {
            description: 'List site-level threat management events detected by IPS, with optional time range and keyword filtering.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listSiteThreatManagement', async (args) =>
            toToolResult(
                await client.listSiteThreatManagement(
                    {
                        page: args.page,
                        pageSize: args.pageSize,
                        startTime: args.startTime,
                        endTime: args.endTime,
                        searchKey: args.searchKey,
                    },
                    args.siteId,
                    args.customHeaders
                )
            )
        )
    );
}
