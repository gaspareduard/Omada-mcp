import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    payload: z
        .record(z.string(), z.unknown())
        .describe('Firewall settings payload that matches the official Omada Open API firewall schema for the site.'),
    dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, fetch the current firewall settings and return the planned change without applying it.'),
});

export function registerSetFirewallSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setFirewallSetting',
        {
            description: 'Update site firewall settings through the official Omada Open API with dry-run preview support.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setFirewallSetting',
            ({ siteId }, result, mode) => ({
                action: 'set-firewall-setting',
                target: siteId ?? 'default-site',
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? 'Planned firewall settings update.' : 'Firewall settings update requested.',
                result,
            }),
            async ({ payload, siteId, customHeaders, dryRun }) => {
                const before = await client.getFirewallSetting(siteId, customHeaders);

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before,
                        plannedConfig: payload,
                    };
                }

                const applied = await client.setFirewallSetting(payload, siteId, customHeaders);
                return {
                    before,
                    applied,
                };
            }
        )
    );
}
