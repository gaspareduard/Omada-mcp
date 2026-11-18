import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = z.object({
    groupId: z.string().trim().min(1).describe('External user group ID from listExternalUserGroups.'),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'deleteExternalUserGroup' | 'listExternalUserGroups'>;

export function registerDeleteExternalUserGroupTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteExternalUserGroup',
        {
            description:
                'Delete an SSO external user group; its members lose the access it granted. Defaults to a preview of the record; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteExternalUserGroup',
            mutationSummary('delete-external-user-group', (args) => String(args.groupId)),
            async ({ groupId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: { label: 'external user group', list: () => client.listExternalUserGroups(customHeaders) },
                    id: groupId,
                    dryRun,
                    write: () => client.deleteExternalUserGroup(groupId, customHeaders),
                })
        )
    );
}
