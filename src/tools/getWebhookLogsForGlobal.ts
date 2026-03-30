import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetWebhookLogsForGlobalTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(),
        webhookId: z.string().min(1).describe('Webhook ID to filter dispatch logs for.'),
        timeStart: z.number().int().describe('Start of time range in Unix epoch milliseconds (e.g. 1679297710438).'),
        timeEnd: z.number().int().describe('End of time range in Unix epoch milliseconds (e.g. 1681889710438).'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getWebhookLogsForGlobal',
        {
            description:
                'Get webhook dispatch logs (paginated). Requires webhookId and a time range in epoch milliseconds. Returns delivery attempts and their status.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getWebhookLogsForGlobal', async ({ page, pageSize, webhookId, timeStart, timeEnd, customHeaders }) =>
            toToolResult(await client.getWebhookLogsForGlobal(page ?? 1, pageSize ?? 10, webhookId, timeStart, timeEnd, customHeaders))
        )
    );
}
