import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetThreatListTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteList: z.string().optional().describe('Comma-separated site IDs. If not provided, all sites are selected by default.'),
        archived: z.boolean().describe('Whether to include archived threats'),
        ...createPaginationSchema(10),
        startTime: z.number().int().describe('Start timestamp in seconds (e.g., 1682000000)'),
        endTime: z.number().int().describe('End timestamp in seconds (e.g., 1682000000)'),
        severity: z.number().int().min(0).max(3).optional().describe('Threat severity: 0=Critical, 1=Major, 2=Concerning, 3=Minor'),
        sortTime: z.enum(['asc', 'desc']).optional().describe('Sort by time: asc or desc'),
        searchKey: z.string().optional().describe('Fuzzy search for Threat Description/Classification/Classification Description'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getThreatList',
        {
            description:
                'Get the global view threat management list. Returns paginated threat information including severity, source/destination IPs, countries, classification, and more.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getThreatList', async (args) => {
            const options = {
                siteList: args.siteList,
                archived: args.archived,
                page: args.page,
                pageSize: args.pageSize,
                startTime: args.startTime,
                endTime: args.endTime,
                severity: args.severity,
                sortTime: args.sortTime,
                searchKey: args.searchKey,
            };

            return toToolResult(await client.getThreatList(options, args.customHeaders));
        })
    );
}
