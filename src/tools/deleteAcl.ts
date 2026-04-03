import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { deleteAclInputSchema, findAclById } from './gatewayAclShared.js';

export function registerDeleteAclTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'deleteAcl',
        {
            description: 'Delete an existing ACL rule by ID. Use listOsgAcls or listEapAcls first to identify the rule.',
            inputSchema: deleteAclInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'deleteAcl',
            ({ aclId, siteId }, result, mode) => ({
                action: 'delete-acl',
                target: aclId,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned ACL deletion for ${aclId}.` : `ACL deletion requested for ${aclId}.`,
                result,
            }),
            async ({ aclId, dryRun, siteId, customHeaders }) => {
                const aclLookupErrors: Error[] = [];
                let existing = undefined;

                try {
                    existing = findAclById(await client.listEapAcls(siteId, customHeaders), aclId);
                } catch (error) {
                    aclLookupErrors.push(error instanceof Error ? error : new Error(String(error)));
                }

                if (!existing) {
                    try {
                        existing = findAclById(await client.listOsgAcls(siteId, customHeaders), aclId);
                    } catch (error) {
                        aclLookupErrors.push(error instanceof Error ? error : new Error(String(error)));
                    }
                }

                if (!existing) {
                    if (aclLookupErrors.length > 0) {
                        throw aclLookupErrors[0];
                    }
                    throw new Error(`No ACL exists for ${aclId}.`);
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before: existing,
                    };
                }

                return await client.deleteAcl(aclId, siteId, customHeaders);
            }
        )
    );
}
