import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { setAccessControlInputSchema } from './firewallTrafficShared.js';

export function registerSetAccessControlTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setAccessControl',
        {
            description:
                'Update portal access control settings with dry-run preview support using the official Omada Open API access control schema.',
            inputSchema: setAccessControlInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setAccessControl',
            ({ siteId }, result, mode) => ({
                action: 'set-access-control',
                target: siteId ?? 'default-site',
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? 'Planned portal access control update.' : 'Portal access control update requested.',
                result,
            }),
            async ({ payload, dryRun, siteId, customHeaders }) => {
                const before = await client.getAccessControl(siteId, customHeaders);

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before,
                        plannedConfig: payload,
                    };
                }

                const applied = await client.setAccessControl(payload, siteId, customHeaders);
                return {
                    before,
                    applied,
                };
            }
        )
    );
}
