import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const listDevicesStatsSchema = z.object({
    page: z.number().min(1, 'page must be at least 1').default(1),
    pageSize: z.number().min(1).max(1000, 'pageSize must be between 1 and 1000').default(100),
    searchMacs: z.string().optional(),
    searchNames: z.string().optional(),
    searchModels: z.string().optional(),
    searchSns: z.string().optional(),
    filterTag: z.string().optional(),
    filterDeviceSeriesType: z.string().optional(),
});

export function registerListDevicesStatsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listDevicesStats',
        {
            description:
                'Query statistics for global adopted devices with pagination and filtering. Supports fuzzy search by MAC address, name, model, or serial number, and filtering by tag or device series type (0: basic, 1: pro).',
            inputSchema: listDevicesStatsSchema.shape,
        },
        wrapToolHandler('listDevicesStats', async (args) =>
            toToolResult(
                await client.listDevicesStats({
                    page: args.page,
                    pageSize: args.pageSize,
                    searchMacs: args.searchMacs,
                    searchNames: args.searchNames,
                    searchModels: args.searchModels,
                    searchSns: args.searchSns,
                    filterTag: args.filterTag,
                    filterDeviceSeriesType: args.filterDeviceSeriesType,
                })
            )
        )
    );
}
