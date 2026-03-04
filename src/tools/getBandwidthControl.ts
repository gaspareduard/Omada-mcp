import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetBandwidthControlTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getBandwidthControl',
        {
            description:
                'Get the global bandwidth control configuration for the site. Shows whether bandwidth control is enabled and the default policy.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getBandwidthControl', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getBandwidthControl(siteId, customHeaders))
        )
    );
}
