import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const listSitesSchema = z.object({
    customHeaders: customHeadersSchema,
});

export function registerListSitesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listSites',
        {
            description: 'List all sites configured on the Omada controller.',
            inputSchema: listSitesSchema.shape,
        },
        wrapToolHandler('listSites', async ({ customHeaders }) => toToolResult(await client.listSites(customHeaders)))
    );
}
