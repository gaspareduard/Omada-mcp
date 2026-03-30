import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSshSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSshSetting',
        {
            description: 'Get SSH access settings for a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSshSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getSshSetting(siteId, customHeaders)))
    );
}
