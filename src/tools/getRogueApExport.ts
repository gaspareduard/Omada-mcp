import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const rogueApFormatSchema = z.enum(['0', '1']).optional().default('0');

export function registerGetRogueApExportTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteId: z.string().optional().describe('Site ID. Uses the default site if omitted.'),
        format: rogueApFormatSchema.describe('Export format: "0" for CSV, "1" for Excel (xlsx). Defaults to "0" (CSV).'),
        ...createPaginationSchema(10),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getRogueApExport',
        {
            description: 'Export Rogue AP scan results for a site. Returns detected rogue access points in CSV or Excel format.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRogueApExport', async ({ siteId, format, page, pageSize, customHeaders }) =>
            toToolResult(await client.getRogueApExport(siteId, format, page, pageSize, customHeaders))
        )
    );
}
