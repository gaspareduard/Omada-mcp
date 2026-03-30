import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetWanQosConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWanQosConfig',
        {
            description: 'Get QoS configuration for gateway WAN ports on the site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getWanQosConfig', async ({ siteId, customHeaders }) => toToolResult(await client.getWanQosConfig(siteId, customHeaders)))
    );
}
