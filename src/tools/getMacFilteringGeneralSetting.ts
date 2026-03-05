import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetMacFilteringGeneralSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMacFilteringGeneralSetting',
        {
            description: 'Get the MAC filtering global setting. Returns whether MAC-based allow/deny filtering is enabled site-wide.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getMacFilteringGeneralSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getMacFilteringGeneralSetting(siteId, customHeaders))
        )
    );
}
