import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    customHeaders: customHeadersSchema,
});

export function registerGetSessionLimitTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSessionLimit',
        {
            description: 'Get the session limit global setting for the site gateway. Shows whether per-IP session limiting is enabled.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSessionLimit', async ({ siteId, customHeaders }) => toToolResult(await client.getSessionLimit(siteId, customHeaders)))
    );
}
