import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const rogueApFormatSchema = z.enum(['csv', 'excel']).optional().default('csv');

export function registerGetRogueApExportTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteId: z.string().optional().describe('Site ID. Uses the default site if omitted.'),
        format: rogueApFormatSchema.describe('Export format: "csv" or "excel". Defaults to "csv".'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getRogueApExport',
        {
            description: 'Export Rogue AP scan results for a site. Returns detected rogue access points in CSV or Excel format.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRogueApExport', async ({ siteId, format, customHeaders }) =>
            toToolResult(await client.getRogueApExport(siteId, format, customHeaders))
        )
    );
}
