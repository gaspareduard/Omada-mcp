import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerListSiteAuditLogsTool(server: McpServer, client: OmadaClient): void {
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
                'Filter logs after this time. Unix timestamp in milliseconds (e.g. Date.now() - 86400000 for last 24h). Both startTime and endTime must be provided together.'
            ),
        endTime: z
            .number()
            .int()
            .optional()
            .describe(
                'Filter logs before this time. Unix timestamp in milliseconds (e.g. Date.now()). Both startTime and endTime must be provided together.'
            ),
        searchKey: z.string().optional().describe('Keyword to filter logs by action description or username.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'listSiteAuditLogs',
        {
            description:
                'List admin audit logs for a site: who made what configuration change and when. Returns username, action description, source IP, and timestamp. Useful for tracking config changes or troubleshooting who changed what.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listSiteAuditLogs', async (args) =>
            toToolResult(
                await client.listSiteAuditLogs(
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
