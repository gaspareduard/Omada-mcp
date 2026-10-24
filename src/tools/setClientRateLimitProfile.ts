import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
export function registerSetClientRateLimitProfileTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        clientMac: deviceMacSchema,
        profileId: z.string().min(1),
        dryRun: z.boolean().optional().default(true).describe('Preview without changing the controller. Set false explicitly to apply.'),
    });
    server.registerTool(
        'setClientRateLimitProfile',
        {
            description: 'Apply a predefined client rate limit profile. Use getRateLimitProfiles to discover profiles. Preview is the default.',
            inputSchema: inputSchema.shape,
            annotations: { readOnlyHint: false, destructiveHint: true },
        },
        wrapMutationToolHandler(
            'setClientRateLimitProfile',
            ({ clientMac, siteId }, result, mode) => ({
                action: 'setClientRateLimitProfile',
                target: clientMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'submitted',
                summary: mode === 'dry-run' ? 'Client rate-limit change planned.' : 'Client rate-limit change submitted.',
                result,
            }),
            async ({ clientMac, profileId, siteId, customHeaders, dryRun }) => {
                if (dryRun) return { accepted: true, dryRun: true };
                return await client.setClientRateLimitProfile(clientMac, profileId, siteId, customHeaders);
            }
        )
    );
}
