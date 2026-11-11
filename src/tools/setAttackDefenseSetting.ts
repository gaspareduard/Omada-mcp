import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { attackDefenseSettingSchema } from '../omadaClient/requestSchemas.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runSettings } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    payload: attackDefenseSettingSchema.describe('Complete attack defense setting (official AttackDefenseSetting).'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getAttackDefenseSetting' | 'setAttackDefenseSetting'>;

export function registerSetAttackDefenseSettingTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setAttackDefenseSetting',
        {
            description:
                'Update gateway attack and DoS defense (flood limits, scan/ping-of-death protection, WAN ping blocking). Defaults to a preview of the current settings and differences; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setAttackDefenseSetting',
            mutationSummary('set-attack-defense-setting', (args) => args.siteId ?? 'default-site'),
            async ({ payload, siteId, customHeaders, dryRun }) =>
                await runSettings({
                    label: 'attack defense',
                    read: () => client.getAttackDefenseSetting(siteId, customHeaders),
                    payload,
                    dryRun,
                    write: () => client.setAttackDefenseSetting(payload, siteId, customHeaders),
                })
        )
    );
}
