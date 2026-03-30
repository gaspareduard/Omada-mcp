import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetWanPortsConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWanPortsConfig',
        {
            description:
                'Get WAN port settings for the site gateway. Returns per-port WAN configuration including connection type, IP settings, and MTU.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getWanPortsConfig', async ({ siteId, customHeaders }) => toToolResult(await client.getWanPortsConfig(siteId, customHeaders)))
    );
}
