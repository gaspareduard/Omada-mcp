import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { modifyControllerRoleVO01Schema } from '../omadaClient/requestSchemas.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runCreate } from './resourceMutationShared.js';

const inputSchema = z.object({
    payload: modifyControllerRoleVO01Schema.describe(
        'Role (official ModifyControllerRoleVO): a unique name and per-area privileges (0 block, 1 view only, 2 modify/access).'
    ),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'createRole' | 'getAllRoles' | 'getRoleDetail'>;

export function registerCreateRoleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'createRole',
        {
            description:
                'Create a custom controller administrator role with per-area privileges. Defaults to a preview; set dryRun:false to apply once and verify by reading the role back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'createRole',
            mutationSummary('create-role', (args) => String((args.payload as { name?: unknown }).name)),
            async ({ payload, customHeaders, dryRun }) =>
                await runCreate({
                    spec: {
                        label: 'role',
                        list: () => client.getAllRoles(customHeaders),
                        detail: (id) => client.getRoleDetail(id, customHeaders),
                    },
                    payload,
                    dryRun,
                    write: () => client.createRole(payload, customHeaders),
                })
        )
    );
}
