import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { createGroupOpenApiVOSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    groupType: z
        .string()
        .trim()
        .min(1)
        .describe('Numeric group type of the existing profile, as a string: 0 IP, 1 IP-port, 2 MAC, 3 IPv6, 4 IPv6-port, 5 country, 7 domain.'),
    groupId: z.string().trim().min(1).describe('Group profile ID (groupId) from listGroupProfiles.'),
    payload: createGroupOpenApiVOSchema.describe(
        'Complete group profile (official CreateGroupOpenApiVO). Read the current record first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'listGroupProfiles' | 'updateGroupProfile'>;

export function registerUpdateGroupProfileTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateGroupProfile',
        {
            description:
                'Replace an existing group profile. Every ACL or rule that references the group changes behaviour immediately. Defaults to a preview; set dryRun:false to apply once and verify by reading the controller back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateGroupProfile',
            mutationSummary('update-group-profile', (args) => String(args.groupId)),
            async ({ groupType, groupId, payload, siteId, customHeaders, dryRun }) =>
                await runUpdate({
                    spec: {
                        label: 'group profile',
                        list: () => client.listGroupProfiles(undefined, siteId, customHeaders),
                        idKeys: ['groupId', 'id'],
                    },
                    id: groupId,
                    payload,
                    dryRun,
                    write: () => client.updateGroupProfile(groupType, groupId, payload, siteId, customHeaders),
                    warnings: ['Rules referencing this group change behaviour immediately.'],
                })
        )
    );
}
