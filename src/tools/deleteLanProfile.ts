import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    profileId: z.string().trim().min(1).describe('LAN (switch port) profile ID from getLanProfileList.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteLanProfile' | 'getLanProfileList'>;

export function registerDeleteLanProfileTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteLanProfile',
        {
            description:
                'Delete a custom switch port profile. System profiles are refused. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteLanProfile',
            mutationSummary('delete-lan-profile', (args) => String(args.profileId)),
            async ({ profileId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'LAN profile',
                        list: () => client.getLanProfileList(siteId, customHeaders),
                    },
                    id: profileId,
                    dryRun,
                    write: () => client.deleteLanProfile(profileId, siteId, customHeaders),
                    guard: (record) => {
                        if (record.flag === 0) throw new Error('System LAN profiles (All, Default, Disable) cannot be deleted.');
                    },
                })
        )
    );
}
