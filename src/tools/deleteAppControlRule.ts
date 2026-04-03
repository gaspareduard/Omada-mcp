import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { findGridRecordById } from './firewallTrafficShared.js';

const inputSchema = siteInputSchema.extend({
    ruleId: z.string().trim().min(1, 'ruleId is required.'),
    dryRun: z.boolean().optional().default(false),
});

export function registerDeleteAppControlRuleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'deleteAppControlRule',
        {
            description: 'Delete an existing application control rule with dry-run preview support.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'deleteAppControlRule',
            ({ ruleId, siteId }, result, mode) => ({
                action: 'delete-app-control-rule',
                target: ruleId,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned application control rule deletion for ${ruleId}.`
                        : `Application control rule deletion requested for ${ruleId}.`,
                result,
            }),
            async ({ ruleId, dryRun, siteId, customHeaders }) => {
                const existingRules = await client.getAppControlRules(1, 1000, siteId, customHeaders);
                const before = findGridRecordById(existingRules, ruleId);
                if (!before) {
                    throw new Error(`No application control rule exists for ${ruleId}.`);
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before,
                    };
                }

                return await client.deleteAppControlRule(ruleId, siteId, customHeaders);
            }
        )
    );
}
