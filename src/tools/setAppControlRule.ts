import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { wrapMutationToolHandler } from '../server/common.js';
import { findGridRecordById, parseAppControlPayload, setAppControlRuleInputSchema } from './firewallTrafficShared.js';

export function registerSetAppControlRuleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setAppControlRule',
        {
            description:
                'Create or update an application control rule with dry-run preview support. Create uses the Omada AddRuleEntity schema; update uses the Omada EditRuleEntity schema.',
            inputSchema: setAppControlRuleInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setAppControlRule',
            ({ ruleId, siteId }, result, mode) => ({
                action: ruleId ? 'update-app-control-rule' : 'create-app-control-rule',
                target: ruleId ?? siteId ?? 'default-site',
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? 'Planned application control rule mutation.' : 'Application control rule mutation requested.',
                result,
            }),
            async ({ ruleId, payload, dryRun, siteId, customHeaders }) => {
                const parsedPayload = await parseAppControlPayload(client, ruleId, payload, siteId, customHeaders);
                const existingRules = await client.getAppControlRules(1, 1000, siteId, customHeaders);
                const before = ruleId ? findGridRecordById(existingRules, ruleId) : undefined;

                if (ruleId && !before) {
                    throw new Error(`No application control rule exists for ${ruleId}.`);
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before,
                        plannedRule: parsedPayload,
                    };
                }

                return ruleId
                    ? await client.updateAppControlRule(ruleId, parsedPayload, siteId, customHeaders)
                    : await client.createAppControlRule(parsedPayload, siteId, customHeaders);
            }
        )
    );
}
