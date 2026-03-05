import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSsidsBySiteTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        type: z.number().int().min(1).max(3).describe('Device type filter: 1 = AP only, 2 = wireless router only, 3 = AP and wireless router.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'getSsidsBySite',
        {
            description:
                'Get a flat SSID list filtered by device type. Returns all SSIDs configured on the site for the specified device category (AP, wireless router, or both).',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSsidsBySite', async ({ type, siteId, customHeaders }) =>
            toToolResult(await client.getSsidsBySite(type, siteId, customHeaders))
        )
    );
}
