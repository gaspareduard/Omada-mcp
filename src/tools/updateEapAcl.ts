import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { eapAclPayloadSchema, findAclById, updateEapAclInputSchema, validateEapAclPayloadReferences } from './gatewayAclShared.js';

export function registerUpdateEapAclTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateEapAcl',
        {
            description: 'Update an existing EAP ACL rule using the official Omada Open API.',
            inputSchema: updateEapAclInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'updateEapAcl',
            ({ aclId, siteId }, result, mode) => ({
                action: 'update-eap-acl',
                target: aclId,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned EAP ACL update for ${aclId}.` : `EAP ACL update requested for ${aclId}.`,
                result,
            }),
            async ({ aclId, payload, dryRun, siteId, customHeaders }) => {
                const parsedPayload = eapAclPayloadSchema.parse(payload);
                const existing = findAclById(await client.listEapAcls(siteId, customHeaders), aclId);
                if (!existing) {
                    throw new Error(`No EAP ACL exists for ${aclId}.`);
                }

                await validateEapAclPayloadReferences(client, parsedPayload, siteId, customHeaders);

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before: existing,
                        plannedAcl: parsedPayload,
                    };
                }

                return await client.updateEapAcl(aclId, parsedPayload, siteId, customHeaders);
            }
        )
    );
}
