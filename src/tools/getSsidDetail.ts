import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const ssidDetailSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    siteId: z.string().min(1).optional(),
    customHeaders: customHeadersSchema,
});

export function registerGetSsidDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSsidDetail',
        {
            description:
                'Get detailed information for a specific SSID (wireless network), including security settings, rate limits, scheduling, and advanced configurations. Requires wlanId (from getWlanGroupList) and ssidId (from getSsidList).',
            inputSchema: ssidDetailSchema.shape,
        },
        wrapToolHandler('getSsidDetail', async ({ wlanId, ssidId, siteId, customHeaders }) =>
            toToolResult(await client.getSsidDetail(wlanId, ssidId, siteId, customHeaders))
        )
    );
}
