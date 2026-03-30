import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetChannelLimitSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getChannelLimitSetting',
        {
            description: '[DEPRECATED] Get the channel limit setting that restricts which channels access points are allowed to use on the site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getChannelLimitSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getChannelLimitSetting(siteId, customHeaders))
        )
    );
}
