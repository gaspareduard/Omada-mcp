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
            description:
                'Get controller access control configuration. Shows which IP ranges are permitted to access the Omada controller management interface.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getAccessControl', async ({ siteId, customHeaders }) => toToolResult(await client.getAccessControl(siteId, customHeaders)))
    );
}
