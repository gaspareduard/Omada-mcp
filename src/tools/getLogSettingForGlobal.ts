import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetLogSettingForGlobalTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLogSettingForGlobal',
        {
            description: 'Get global log notification settings (v1), including global alert recipients and notification rules.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getLogSettingForGlobal', async ({ customHeaders }) => toToolResult(await client.getLogSettingForGlobal(customHeaders)))
    );
}
