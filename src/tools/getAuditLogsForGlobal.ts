import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetAuditLogsForGlobalTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(),
        sortTime: z.enum(['asc', 'desc']).optional().describe('Sort direction for time field.'),
        filterResult: z.number().int().optional().describe('Filter by operation result code.'),
        filterLevel: z.string().optional().describe('Filter by log level.'),
        filterAuditTypes: z.string().optional().describe('Filter by audit type identifiers (comma-separated).'),
        filterTimes: z.string().optional().describe('Filter by time range expression.'),
        searchKey: z.string().optional().describe('Keyword to search within audit log entries.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getAuditLogsForGlobal',
        {
            description:
                'Get global audit logs (paginated). Records all administrative operations across the controller. Supports optional filters by result, level, type, and time range.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler(
            'getAuditLogsForGlobal',
            async ({ page, pageSize, sortTime, filterResult, filterLevel, filterAuditTypes, filterTimes, searchKey, customHeaders }) =>
                toToolResult(
                    await client.getAuditLogsForGlobal(
                        page ?? 1,
                        pageSize ?? 10,
                        { sortTime, filterResult, filterLevel, filterAuditTypes, filterTimes, searchKey },
                        customHeaders
                    )
                )
        )
    );
}
