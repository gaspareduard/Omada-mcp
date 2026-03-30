import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend(createPaginationSchema());

export function registerListSitesStacksTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listSitesStacks',
        {
            description: 'List switch stacks in a site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listSitesStacks', async ({ siteId, page, pageSize, customHeaders }) =>
            toToolResult(await client.listSitesStacks(siteId, page ?? 1, pageSize ?? 10, customHeaders))
        )
    );
}
