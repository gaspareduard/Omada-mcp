import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { lanProfileUpdatePayloadSchema } from './payloadRequirements.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    profileId: z.string().trim().min(1).describe('LAN (switch port) profile ID from getLanProfileList.'),
    payload: lanProfileUpdatePayloadSchema.describe(
        'Complete switch port profile (official LanProfileConfigOpenApiVO). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getLanProfileList' | 'updateLanProfile'>;

export function registerUpdateLanProfileTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateLanProfile',
        {
            description:
                'Replace an existing switch port profile. Every port using the profile is re-provisioned and may briefly lose connectivity. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateLanProfile',
            mutationSummary('update-lan-profile', (args) => String(args.profileId)),
            async ({ profileId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'LAN profile',
                        list: () => client.getLanProfileList(siteId, customHeaders),
                    },
                    id: profileId,
                    payload,
                    dryRun,
                    write: () => client.updateLanProfile(profileId, payload, siteId, customHeaders),
                    warnings: ['Ports using this profile are re-provisioned and can briefly lose connectivity.'],
                })
        )
    );
}
