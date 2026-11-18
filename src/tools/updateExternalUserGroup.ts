import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { externalUserGroupOpenApiVO01Schema } from '../omadaClient/requestSchemas.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { normalizeExternalUserGroup, sortSites } from './externalUserGroupShared.js';
import { dryRunSchema, mutationSummary, runUpdate } from './resourceMutationShared.js';

const inputSchema = z.object({
    groupId: z.string().trim().min(1).describe('External user group ID from listExternalUserGroups.'),
    payload: externalUserGroupOpenApiVO01Schema.describe('Complete external user group (official ExternalUserGroupOpenApiVO).'),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'listExternalUserGroups' | 'updateExternalUserGroup'>;

export function registerUpdateExternalUserGroupTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateExternalUserGroup',
        {
            description:
                'Replace an SSO external user group, e.g. to change its role or site scope; members are affected at their next login. Defaults to a preview; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateExternalUserGroup',
            mutationSummary('update-external-user-group', (args) => String(args.groupId)),
            async ({ groupId, payload, customHeaders, dryRun }) => {
                const request = sortSites(payload);
                return await runUpdate({
                    spec: {
                        label: 'external user group',
                        list: () => client.listExternalUserGroups(customHeaders),
                        normalize: normalizeExternalUserGroup,
                    },
                    id: groupId,
                    payload: request,
                    dryRun,
                    write: () => client.updateExternalUserGroup(groupId, request, customHeaders),
                });
            }
        )
    );
}
