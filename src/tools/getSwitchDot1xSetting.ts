import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSwitchDot1xSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSwitchDot1xSetting',
        {
            description: 'Get the 802.1X switch port authentication setting. Controls port-based network access control on managed switches.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSwitchDot1xSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getSwitchDot1xSetting(siteId, customHeaders))
        )
    );
}
