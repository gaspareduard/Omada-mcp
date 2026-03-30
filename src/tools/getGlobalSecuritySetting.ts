import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    archived: z.boolean().default(false).describe('Whether to include archived threats.'),
    page: z.number().int().min(1).default(1).describe('Page number (1-based).'),
    pageSize: z.number().int().min(1).max(1000).default(10).describe('Number of results per page (1–1000).'),
    startTime: z.number().int().describe('Start of time range in epoch milliseconds.'),
    endTime: z.number().int().describe('End of time range in epoch milliseconds.'),
    customHeaders: customHeadersSchema.describe(
        'Optional HTTP headers to include in the Omada API request (e.g. {"X-Custom-Header": "value"}). Rarely needed.'
    ),
});

export function registerGetGlobalSecuritySettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGlobalSecuritySetting',
        {
            description:
                '[DEPRECATED] Use getThreatList instead. Same threat-management endpoint. Name was misleading. Get the global security threat management list from the controller. Returns detected threats across all sites with severity, type, and timing details.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGlobalSecuritySetting', async ({ archived, page, pageSize, startTime, endTime, customHeaders }) =>
            toToolResult(await client.getThreatList({ archived, page, pageSize, startTime, endTime }, customHeaders))
        )
    );
}
