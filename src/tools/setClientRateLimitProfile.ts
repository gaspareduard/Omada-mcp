import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerSetClientRateLimitProfileTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        clientMac: z.string().min(1, 'clientMac (MAC address) is required'),
        profileId: z.string().min(1, 'profileId (rate limit profile ID) is required'),
    });

    server.registerTool(
        'setClientRateLimitProfile',
        {
            description: 'Apply a predefined rate limit profile to a specific client. Use getRateLimitProfiles to get available profile IDs.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('setClientRateLimitProfile', async ({ clientMac, profileId, siteId, customHeaders }) =>
            toToolResult(await client.setClientRateLimitProfile(clientMac, profileId, siteId, customHeaders))
        )
    );
}
