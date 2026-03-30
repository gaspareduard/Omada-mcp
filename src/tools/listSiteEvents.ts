import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerListSiteEventsTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(100),
        siteId: z
            .string()
            .min(1)
            .optional()
            .describe('Site ID to target. If omitted, uses the default site from OMADA_SITE_ID config. Use listSites to discover site IDs.'),
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
        'listSiteEvents',
        {
            description:
                'List system event logs for a site: device online/offline, client connect/disconnect, firmware upgrades, config changes, etc. Returns event type, severity, description, device, and timestamp. Use startTime/endTime (both required if filtering by time) to narrow the range.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listSiteEvents', async (args) =>
            toToolResult(
                await client.listSiteEvents(
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
