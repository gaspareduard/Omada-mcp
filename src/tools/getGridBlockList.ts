import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridBlockListTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(),
        searchKey: z.string().optional().describe('Optional search keyword to filter IPS block-list entries.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getGridBlockList',
        {
            description:
                'Get the IPS block list (paginated). Returns entries that are explicitly blocked by the Intrusion Prevention System. Supports optional keyword search.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGridBlockList', async ({ page, pageSize, searchKey, siteId, customHeaders }) =>
            toToolResult(await client.getGridBlockList(page ?? 1, pageSize ?? 10, searchKey, siteId, customHeaders))
        )
    );
}
