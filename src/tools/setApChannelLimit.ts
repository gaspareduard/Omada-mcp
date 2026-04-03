import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    apMac: deviceMacSchema.describe('MAC address of the access point to update.'),
    channelLimitType: z.union([z.literal(0), z.literal(1), z.literal(2)]).describe('Channel limit status: 0=default, 1=disabled, 2=enabled.'),
    dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, validate and summarize the planned AP channel-limit change without applying it.'),
});

export function registerSetApChannelLimitTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setApChannelLimit',
        {
            description: 'Update channel-limit settings for a specific Omada access point after checking feature support.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setApChannelLimit',
            ({ apMac, siteId }, result, mode) => ({
                action: 'set-ap-channel-limit',
                target: apMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned AP channel-limit update for ${apMac}.` : `AP channel-limit update requested for ${apMac}.`,
                result,
            }),
            async ({ apMac, channelLimitType, siteId, customHeaders, dryRun }) => {
                const current = (await client.getSitesApsChannelLimit(apMac, siteId, customHeaders)) as { supportChannelLimit?: boolean };
                if (current.supportChannelLimit === false) {
                    throw new Error(`AP ${apMac} does not support channel-limit configuration.`);
                }

                const payload = { channelLimitType };

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before: current,
                        plannedConfig: payload,
                    };
                }

                return await client.setSitesApsChannelLimit(apMac, payload, siteId, customHeaders);
            }
        )
    );
}
