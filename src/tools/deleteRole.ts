import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runDelete } from './resourceMutationShared.js';

const inputSchema = z.object({
    roleId: z.string().trim().min(1).describe('Role ID from getUserRoleProfile. Built-in (default) roles cannot be deleted.'),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'deleteRole' | 'getAllRoles'>;

export function registerDeleteRoleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'deleteRole',
        {
            description:
                'Delete a custom controller role. The controller refuses roles still bound to users or SSO groups. Defaults to a preview of the role; set dryRun:false to delete and verify it is gone.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'deleteRole',
            mutationSummary('delete-role', (args) => String(args.roleId)),
            async ({ roleId, customHeaders, dryRun }) =>
                await runDelete({
                    spec: { label: 'role', list: () => client.getAllRoles(customHeaders) },
                    id: roleId,
                    dryRun,
                    guard: (record) => {
                        if (record.defaultRole === true) throw new Error(`Role "${roleId}" is a built-in role and cannot be deleted.`);
                    },
                    write: () => client.deleteRole(roleId, customHeaders),
                })
        )
    );
}
