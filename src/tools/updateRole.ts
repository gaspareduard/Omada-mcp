import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { modifyControllerRoleVO01Schema } from '../omadaClient/requestSchemas.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, findRecord, mutationSummary, runUpdate, toRecords } from './resourceMutationShared.js';

const inputSchema = z.object({
    roleId: z.string().trim().min(1).describe('Role ID from getUserRoleProfile. Built-in (default) roles cannot be changed.'),
    payload: modifyControllerRoleVO01Schema.describe(
        'Role (official ModifyControllerRoleVO). Read getRoleDetail first and send every privilege you want to keep.'
    ),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'getAllRoles' | 'getRoleDetail' | 'updateRole'>;

export function registerUpdateRoleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'updateRole',
        {
            description:
                'Rename a custom controller role or change its privileges; every user bound to the role is affected. Defaults to a preview; set dryRun:false to apply once and verify by reading the role back.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'updateRole',
            mutationSummary('update-role', (args) => String(args.roleId)),
            async ({ roleId, payload, customHeaders, dryRun }) => {
                const role = findRecord(toRecords(await client.getAllRoles(customHeaders)), roleId);
                if (role?.defaultRole === true) throw new Error(`Role "${roleId}" is a built-in role and cannot be modified.`);
                return await runUpdate({
                    spec: {
                        label: 'role',
                        list: () => client.getAllRoles(customHeaders),
                        detail: (id) => client.getRoleDetail(id, customHeaders),
                    },
                    id: roleId,
                    payload,
                    dryRun,
                    write: () => client.updateRole(roleId, payload, customHeaders),
                    warnings: ['Privilege changes apply immediately to every user and SSO group bound to this role.'],
                });
            }
        )
    );
}
