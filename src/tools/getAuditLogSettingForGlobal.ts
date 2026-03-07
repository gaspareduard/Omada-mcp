import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAuditLogSettingForGlobalTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAuditLogSettingForGlobal',
        {
            description: 'Get global audit log notification settings for the controller.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getAuditLogSettingForGlobal', async ({ customHeaders }) =>
            toToolResult(await client.getAuditLogSettingForGlobal(customHeaders))
        )
    );
}
