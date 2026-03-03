import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListSitesTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'listSites',
        {
            description: 'List all sites configured on the Omada controller.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listSites', async ({ customHeaders }) => toToolResult(await client.listSites(customHeaders)))
    );
}
