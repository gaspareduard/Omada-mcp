import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        profileId: z.string().min(1).describe('LAN profile ID. Use getLanProfileList to find profile IDs.'),
        customHeaders: customHeadersSchema,
    })
    .required({ profileId: true });

export function registerGetLanProfileEsUsageTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLanProfileEsUsage',
        {
            description: 'Get EAP/switch device usage for a specific LAN profile. Returns which devices are using the profile. Requires `profileId`.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getLanProfileEsUsage', async ({ profileId, siteId, customHeaders }) =>
            toToolResult(await client.getLanProfileEsUsage(profileId, siteId, customHeaders))
        )
    );
}
