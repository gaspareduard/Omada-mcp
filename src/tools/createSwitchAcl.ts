import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { createSwitchAclInputSchema, findCreatedAclByDescription, getAclRecordId, switchAclPayloadSchema } from './gatewayAclShared.js';

export function registerCreateSwitchAclTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'createSwitchAcl',
        {
            description: 'Create a switch (OSW) ACL rule for layer-2 access policy control using the official Omada Open API.',
            inputSchema: createSwitchAclInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'createSwitchAcl',
            ({ siteId }, result, mode) => ({
                action: 'create-switch-acl',
                target: siteId ?? 'default-site',
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? 'Planned switch ACL creation.' : 'Switch ACL creation requested.',
                result,
            }),
            async ({ payload, dryRun, siteId, customHeaders }) => {
                const parsedPayload = switchAclPayloadSchema.parse(payload);
                const existingAcls = await client.listOswAcls(siteId, customHeaders);

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        plannedAcl: parsedPayload,
                    };
                }

                const createResult = await client.createOswAcl(parsedPayload, siteId, customHeaders);
                const createdAclId = (() => {
                    if (!createResult || typeof createResult !== 'object') {
                        return undefined;
                    }

                    const maybeId =
                        (createResult as { id?: string | number; aclId?: string | number }).id ??
                        (createResult as { id?: string | number; aclId?: string | number }).aclId;
                    return maybeId === undefined ? undefined : String(maybeId);
                })();

                if (createdAclId) {
                    return createResult;
                }

                const aclsAfterCreate = await client.listOswAcls(siteId, customHeaders);
                const createdAcl = findCreatedAclByDescription(existingAcls, aclsAfterCreate, parsedPayload.description);

                if (createdAcl) {
                    return {
                        aclId: getAclRecordId(createdAcl),
                        createdAcl,
                    };
                }

                return createResult;
            }
        )
    );
}
