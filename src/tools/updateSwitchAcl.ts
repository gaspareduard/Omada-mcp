import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { findAclById, switchAclPayloadSchema, updateSwitchAclInputSchema } from './gatewayAclShared.js';

export function registerUpdateSwitchAclTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSwitchAcl',
        {
            description: 'Update an existing switch (OSW) ACL rule using the official Omada Open API.',
            inputSchema: updateSwitchAclInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'updateSwitchAcl',
            ({ aclId, siteId }, result, mode) => ({
                action: 'update-switch-acl',
                target: aclId,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned switch ACL update for ${aclId}.` : `Switch ACL update requested for ${aclId}.`,
                result,
            }),
            async ({ aclId, payload, dryRun, siteId, customHeaders }) => {
                const parsedPayload = switchAclPayloadSchema.parse(payload);
                const existing = findAclById(await client.listOswAcls(siteId, customHeaders), aclId);
                if (!existing) {
                    throw new Error(`No switch ACL exists for ${aclId}.`);
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before: existing,
                        plannedAcl: parsedPayload,
                    };
                }

                return await client.updateOswAcl(aclId, parsedPayload, siteId, customHeaders);
            }
        )
    );
}
