import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAppControlCategoriesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAppControlCategories',
        {
            description:
                'Get application control categories (families) for a site, listing available app category definitions used in application control rules.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getAppControlCategories', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getAppControlCategories(siteId, customHeaders))
        )
    );
}
