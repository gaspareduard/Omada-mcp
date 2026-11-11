import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    groupType: z
        .string()
        .trim()
        .min(1)
        .describe('Numeric group type of the existing profile, as a string: 0 IP, 1 IP-port, 2 MAC, 3 IPv6, 4 IPv6-port, 5 country, 7 domain.'),
    groupId: z.string().trim().min(1).describe('Group profile ID (groupId) from listGroupProfiles.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'deleteGroupProfile' | 'listGroupProfiles'>;

export function registerDeleteGroupProfileTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteGroupProfile',
        {
            description:
                'Delete a custom group profile. Built-in groups are refused; the controller also refuses groups still referenced by rules. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteGroupProfile',
            mutationSummary('delete-group-profile', (args) => String(args.groupId)),
            async ({ groupType, groupId, siteId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: {
                        label: 'group profile',
                        list: () => client.listGroupProfiles(undefined, siteId, customHeaders),
                        idKeys: ['groupId', 'id'],
                    },
                    id: groupId,
                    dryRun,
                    write: () => client.deleteGroupProfile(groupType, groupId, siteId, customHeaders),
                    guard: (record) => {
                        if (record.buildIn === true) throw new Error('Built-in group profiles cannot be deleted.');
                    },
                })
        )
    );
}
