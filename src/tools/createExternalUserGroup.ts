import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { externalUserGroupOpenApiVO01Schema } from '../omadaClient/requestSchemas.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { normalizeExternalUserGroup, sortSites } from './externalUserGroupShared.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = z.object({
    payload: externalUserGroupOpenApiVO01Schema.describe(
        'External user group (official ExternalUserGroupOpenApiVO): name, roleId from getUserRoleProfile, and allSite or a list of site IDs.'
    ),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'createExternalUserGroup' | 'listExternalUserGroups'>;

export function registerCreateExternalUserGroupTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createExternalUserGroup',
        {
            description:
                'Create an SSO external user group that grants identity-provider users a controller role on all or selected sites. Defaults to a preview; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createExternalUserGroup',
            mutationSummary('create-external-user-group', (args) => String((args.payload as { name?: unknown }).name)),
            async ({ payload, customHeaders, dryRun }) => {
                const request = sortSites(payload);
                return await runCreate({
                    spec: {
                        label: 'external user group',
                        list: () => client.listExternalUserGroups(customHeaders),
                        normalize: normalizeExternalUserGroup,
                    },
                    payload: request,
                    dryRun,
                    write: () => client.createExternalUserGroup(request, customHeaders),
                });
            }
        )
    );
}
