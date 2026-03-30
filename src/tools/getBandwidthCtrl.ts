import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetBandwidthCtrlTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getBandwidthCtrl',
        {
            description:
                '[DEPRECATED] Use getBandwidthControl instead. Same GET .../bandwidth-control endpoint. Get the global bandwidth control configuration for the site. Returns whether bandwidth control is enabled and general settings.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getBandwidthCtrl', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getBandwidthControl(siteId, customHeaders))
        )
    );
}
