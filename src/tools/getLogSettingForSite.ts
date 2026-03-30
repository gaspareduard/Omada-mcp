import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetLogSettingForSiteTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLogSettingForSite',
        {
            description: 'Get site-level log notification settings (v1), including alert recipients and notification rules.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getLogSettingForSite', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getLogSettingForSite(siteId, customHeaders))
        )
    );
}
