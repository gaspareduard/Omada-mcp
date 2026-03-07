import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAuditLogSettingForSiteTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAuditLogSettingForSite',
        {
            description: 'Get site-level audit log notification settings, including audit event recipients and filter rules.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getAuditLogSettingForSite', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getAuditLogSettingForSite(siteId, customHeaders))
        )
    );
}
