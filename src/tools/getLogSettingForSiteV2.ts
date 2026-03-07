import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetLogSettingForSiteV2Tool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLogSettingForSiteV2',
        {
            description: 'Get site-level log notification settings (v2), with extended notification configuration options.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getLogSettingForSiteV2', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getLogSettingForSiteV2(siteId, customHeaders))
        )
    );
}
