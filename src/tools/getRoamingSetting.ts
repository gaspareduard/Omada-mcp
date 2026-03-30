import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRoamingSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRoamingSetting',
        {
            description: 'Get the client roaming configuration, including 802.11r/k/v settings that control how clients roam between access points.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getRoamingSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getRoamingSetting(siteId, customHeaders)))
    );
}
