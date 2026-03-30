import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridAllowListTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(),
        searchKey: z.string().optional().describe('Optional search keyword to filter IPS allow-list entries.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getGridAllowList',
        {
            description:
                'Get the IPS allow list (paginated). Returns entries that are explicitly allowed to bypass IPS inspection. Supports optional keyword search.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGridAllowList', async ({ page, pageSize, searchKey, siteId, customHeaders }) =>
            toToolResult(await client.getGridAllowList(page ?? 1, pageSize ?? 10, searchKey, siteId, customHeaders))
        )
    );
}
