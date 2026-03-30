import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetAlgTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAlg',
        {
            description:
                'Get ALG (Application Layer Gateway) configuration for the site gateway. ALG enables inspection of specific application protocols (SIP, FTP, H.323, etc.) through NAT.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getAlg', async ({ siteId, customHeaders }) => toToolResult(await client.getAlg(siteId, customHeaders)))
    );
}
