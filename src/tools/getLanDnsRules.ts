import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend({
    ...createPaginationSchema(),
    customHeaders: customHeadersSchema,
});

export function registerGetLanDnsRulesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLanDnsRules',
        {
            description: 'Get LAN DNS rules configured for the site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getLanDnsRules', async ({ siteId, page, pageSize, customHeaders }) =>
            toToolResult(await client.getLanDnsRules(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
