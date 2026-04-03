import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetAccessControlTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAccessControl',
        {
            description: 'Get portal access control configuration, including pre-auth access policies and free-auth client policies.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getAccessControl', async ({ siteId, customHeaders }) => toToolResult(await client.getAccessControl(siteId, customHeaders)))
    );
}
