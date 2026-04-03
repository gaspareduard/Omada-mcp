import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { gatewayAclConfigModeSchema, setAclConfigTypeInputSchema } from './gatewayAclShared.js';

export function registerSetAclConfigTypeSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setAclConfigTypeSetting',
        {
            description: 'Set gateway ACL mode. 0 = through profiles, 1 = custom. Use this before creating custom gateway ACL rules if needed.',
            inputSchema: setAclConfigTypeInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setAclConfigTypeSetting',
            ({ siteId }, result, mode) => ({
                action: 'set-acl-config-type-setting',
                target: siteId ?? 'default-site',
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? 'Planned ACL config mode update.' : 'ACL config mode update requested.',
                result,
            }),
            async ({ mode, dryRun, siteId, customHeaders }) => {
                const before = await client.getAclConfigTypeSetting(siteId, customHeaders);
                const payload = gatewayAclConfigModeSchema.parse({ mode });

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before,
                        plannedConfig: payload,
                    };
                }

                return await client.setAclConfigTypeSetting(payload, siteId, customHeaders);
            }
        )
    );
}
