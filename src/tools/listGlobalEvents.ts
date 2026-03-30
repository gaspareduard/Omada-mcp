import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerListGlobalEventsTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(100),
        startTime: z
            .number()
            .int()
            .optional()
            .describe(
                'Filter events after this time. Unix timestamp in milliseconds (e.g. Date.now() - 86400000 for last 24h). Both startTime and endTime must be provided together.'
            ),
        endTime: z
            .number()
            .int()
            .optional()
            .describe(
                'Filter events before this time. Unix timestamp in milliseconds (e.g. Date.now()). Both startTime and endTime must be provided together.'
            ),
        searchKey: z.string().optional().describe('Keyword to filter events by description or device name.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'listGlobalEvents',
        {
            description:
                'List system event logs across all sites on the controller. Returns device online/offline, client connect/disconnect, firmware upgrades, config changes, etc. Use startTime/endTime (both required if filtering by time) to narrow the range.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listGlobalEvents', async (args) =>
            toToolResult(
                await client.listGlobalEvents(
                    {
                        page: args.page,
                        pageSize: args.pageSize,
                        startTime: args.startTime,
                        endTime: args.endTime,
                        searchKey: args.searchKey,
                    },
                    args.customHeaders
                )
            )
        )
    );
}
