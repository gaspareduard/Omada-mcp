import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSsidListTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
        siteId: z.string().min(1).optional(),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getSsidList',
        {
            description:
                'Get the list of SSIDs (wireless networks) configured in a WLAN group. Requires wlanId which can be obtained from getWlanGroupList. Use the ssidId from this list to call getSsidDetail.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSsidList', async ({ wlanId, siteId, customHeaders }) =>
            toToolResult(await client.getSsidList(wlanId, siteId, customHeaders))
        )
    );
}
