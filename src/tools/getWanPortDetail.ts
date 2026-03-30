import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetWanPortDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWanPortDetail',
        {
            description:
                '[DEPRECATED] Use getWanPortsConfig instead. Same GET .../internet/ports-config endpoint. Get detailed WAN port configuration for all gateway WAN ports on the site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getWanPortDetail', async ({ siteId, customHeaders }) => toToolResult(await client.getWanPortDetail(siteId, customHeaders)))
    );
}
