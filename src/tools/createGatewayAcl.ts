import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { createGatewayAclInputSchema } from './gatewayAclShared.js';

export function registerCreateGatewayAclTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'createGatewayAcl',
        {
            description: 'Create a gateway ACL rule for site firewall policy control using the official Omada Open API.',
            inputSchema: createGatewayAclInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'createGatewayAcl',
            ({ siteId }, result, mode) => ({
                action: 'create-gateway-acl',
                target: siteId ?? 'default-site',
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? 'Planned gateway ACL creation.' : 'Gateway ACL creation requested.',
                result,
            }),
            async ({ payload, dryRun, siteId, customHeaders }) => {
                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        plannedAcl: payload,
                    };
                }

                return await client.createOsgAcl(payload, siteId, customHeaders);
            }
        )
    );
}
