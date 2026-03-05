import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetMacAuthSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMacAuthSetting',
        {
            description:
                'Get the MAC authentication global setting. MAC auth allows or denies clients based on their MAC address without a password.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getMacAuthSetting', async ({ siteId, customHeaders }) => toToolResult(await client.getMacAuthSetting(siteId, customHeaders)))
    );
}
