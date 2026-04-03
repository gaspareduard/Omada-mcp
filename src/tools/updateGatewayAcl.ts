import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { findAclById, updateGatewayAclInputSchema } from './gatewayAclShared.js';

export function registerUpdateGatewayAclTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateGatewayAcl',
        {
            description: 'Update an existing gateway ACL rule using the official Omada Open API.',
            inputSchema: updateGatewayAclInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'updateGatewayAcl',
            ({ aclId, siteId }, result, mode) => ({
                action: 'update-gateway-acl',
                target: aclId,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned gateway ACL update for ${aclId}.` : `Gateway ACL update requested for ${aclId}.`,
                result,
            }),
            async ({ aclId, payload, dryRun, siteId, customHeaders }) => {
                const existing = findAclById(await client.listOsgAcls(siteId, customHeaders), aclId);
                if (!existing) {
                    throw new Error(`No gateway ACL exists for ${aclId}.`);
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before: existing,
                        plannedAcl: payload,
                    };
                }

                return await client.updateOsgAcl(aclId, payload, siteId, customHeaders);
            }
        )
    );
}
