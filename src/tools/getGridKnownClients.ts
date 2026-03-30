import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridKnownClientsTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(),
        sortLastSeen: z.string().optional().describe('Sort direction for lastSeen field (e.g. "asc" or "desc").'),
        timeStart: z.string().optional().describe('Filter start time (Unix epoch milliseconds as string).'),
        timeEnd: z.string().optional().describe('Filter end time (Unix epoch milliseconds as string).'),
        guest: z.string().optional().describe('Filter by guest status ("true" or "false").'),
        searchKey: z.string().optional().describe('Search keyword to filter clients by name, MAC, or IP.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getGridKnownClients',
        {
            description:
                'Get historical known clients list (paginated). Returns clients that have previously connected to the site, with optional time range and search filtering.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler(
            'getGridKnownClients',
            async ({ page, pageSize, sortLastSeen, timeStart, timeEnd, guest, searchKey, siteId, customHeaders }) =>
                toToolResult(
                    await client.getGridKnownClients(
                        page ?? 1,
                        pageSize ?? 10,
                        { sortLastSeen, timeStart, timeEnd, guest, searchKey },
                        siteId,
                        customHeaders
                    )
                )
        )
    );
}
