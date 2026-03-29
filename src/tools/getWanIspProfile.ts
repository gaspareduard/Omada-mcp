import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema
    .extend({
        portUuid: z.string().min(1).describe('UUID of the WAN port to retrieve ISP scan profile for.'),
        customHeaders: customHeadersSchema,
    })
    .required({ portUuid: true });

export function registerGetWanIspProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWanIspProfile',
        {
            description:
                'Get ISP scan profile result for a specific WAN port. Returns the ISP detection result including detected ISP and recommended settings.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getWanIspProfile', async ({ portUuid, siteId, customHeaders }) =>
            toToolResult(await client.getWanIspProfile(portUuid, siteId, customHeaders))
        )
    );
}
