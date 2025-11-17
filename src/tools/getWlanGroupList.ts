import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetWlanGroupListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWlanGroupList',
        {
            description:
                'Get the list of WLAN groups configured in a site. WLAN groups contain SSIDs and define wireless network settings. Use the wlanId from this list to call getSsidList.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getWlanGroupList', async ({ siteId }) => toToolResult(await client.getWlanGroupList(siteId)))
    );
}
