import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerListGlobalAlertsTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(100),
        startTime: z
            .number()
            .int()
            .optional()
            .describe(
                'Filter alerts after this time. Unix timestamp in milliseconds (e.g. Date.now() - 86400000 for last 24h). Both startTime and endTime must be provided together.'
            ),
        endTime: z
            .number()
            .int()
            .optional()
            .describe(
                'Filter alerts before this time. Unix timestamp in milliseconds (e.g. Date.now()). Both startTime and endTime must be provided together.'
            ),
        searchKey: z.string().optional().describe('Keyword to filter alerts by description or device name.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'listGlobalAlerts',
        {
            description:
                'List alert logs across all sites on the controller: threshold breaches, device failures, security events, etc. Use startTime/endTime (both required if filtering by time) to narrow the range.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listGlobalAlerts', async (args) =>
            toToolResult(
                await client.listGlobalAlerts(
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
