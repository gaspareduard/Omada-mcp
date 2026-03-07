import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetWebhookForGlobalTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWebhookForGlobal',
        {
            description: 'Get the global webhook notification settings, including webhook URL and enabled event types.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getWebhookForGlobal', async ({ customHeaders }) => toToolResult(await client.getWebhookForGlobal(customHeaders)))
    );
}
