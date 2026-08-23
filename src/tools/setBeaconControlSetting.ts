import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    payload: z
        .record(z.string(), z.unknown())
        .describe(
            'Site beacon control payload following the official Omada SiteBeaconControlSetting schema (beaconControl + airtimeFairness). Include the full beaconControl object (dtimPeriod2g/5g/6g and rtsThreshold2g/5g/6g are required) to avoid resetting unspecified fields.'
        ),
    dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, fetch the current beacon control settings and return the planned change without applying it.'),
});

export function registerSetBeaconControlSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setBeaconControlSetting',
        {
            description:
                'Update site beacon control settings (beacon interval/DTIM/RTS thresholds and airtime fairness) through the official Omada Open API with dry-run preview support.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setBeaconControlSetting',
            ({ siteId }, result, mode) => ({
                action: 'set-beacon-control-setting',
                target: siteId ?? 'default-site',
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? 'Planned beacon control settings update.' : 'Beacon control settings update requested.',
                result,
            }),
            async ({ payload, siteId, customHeaders, dryRun }) => {
                const before = await client.getBeaconControlSetting(siteId, customHeaders);

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before,
                        plannedConfig: payload,
                    };
                }

                const applied = await client.setBeaconControlSetting(payload, siteId, customHeaders);
                return {
                    before,
                    applied,
                };
            }
        )
    );
}
