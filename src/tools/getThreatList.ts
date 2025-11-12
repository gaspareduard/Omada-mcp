import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const getThreatListSchema = z.object({
    siteList: z.string().optional().describe('Comma-separated site IDs. If not provided, all sites are selected by default.'),
    archived: z.boolean().describe('Whether to include archived threats'),
    page: z.number().int().min(1).default(1).describe('Page number, starting from 1'),
    pageSize: z.number().int().min(1).max(1000).default(10).describe('Number of entries per page (1-1000)'),
    startTime: z.number().int().describe('Start timestamp in seconds (e.g., 1682000000)'),
    endTime: z.number().int().describe('End timestamp in seconds (e.g., 1682000000)'),
    severity: z.number().int().min(0).max(4).optional().describe('Threat severity: 0=Critical, 1=Major, 2=Moderate, 3=Minor, 4=Low'),
    sortTime: z.enum(['asc', 'desc']).optional().describe('Sort by time: asc or desc'),
    searchKey: z.string().optional().describe('Fuzzy search for Threat Description/Classification/Classification Description'),
});

export function registerGetThreatListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getThreatList',
        {
            description:
                'Get the global view threat management list. Returns paginated threat information including severity, source/destination IPs, countries, classification, and more.',
            inputSchema: getThreatListSchema.shape,
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

            return toToolResult(await client.getThreatList(options));
        })
    );
}
