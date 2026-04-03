import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

interface ApPowerSavingPayload {
    timeEnable: boolean;
    startTimeH?: number;
    startTimeM?: number;
    endTimeH?: number;
    endTimeM?: number;
    bandEnable: boolean;
    bands?: number[];
    idleDuration?: number;
}

const baseInputSchema = siteInputSchema.extend({
    apMac: deviceMacSchema.describe('MAC address of the access point to update.'),
    timeEnable: z.boolean().describe('Enable or disable the time-based power saving schedule.'),
    startTimeH: z.number().int().min(0).max(23).optional().describe('Schedule start hour, required when timeEnable is true.'),
    startTimeM: z.number().int().min(0).max(59).optional().describe('Schedule start minute, required when timeEnable is true.'),
    endTimeH: z.number().int().min(0).max(23).optional().describe('Schedule end hour, required when timeEnable is true.'),
    endTimeM: z.number().int().min(0).max(59).optional().describe('Schedule end minute, required when timeEnable is true.'),
    bandEnable: z.boolean().describe('Enable or disable idle-based band power saving.'),
    bands: z.array(z.number().int().min(0).max(3)).optional().describe('Band ids for idle-based power saving: 0=2.4GHz, 1=5GHz, 2=5GHz-2, 3=6GHz.'),
    idleDuration: z.number().int().min(60).max(1440).optional().describe('Idle duration in minutes, required when bandEnable is true.'),
    dryRun: z.boolean().optional().default(false).describe('If true, validate and summarize the planned AP power-saving change without applying it.'),
});

const inputSchema = baseInputSchema.superRefine((value, ctx) => {
    if (value.timeEnable) {
        for (const field of ['startTimeH', 'startTimeM', 'endTimeH', 'endTimeM'] as const) {
            if (value[field] === undefined) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required when timeEnable is true.` });
            }
        }
    }

    if (value.bandEnable) {
        if (!value.bands || value.bands.length === 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bands'], message: 'bands is required when bandEnable is true.' });
        }
        if (value.idleDuration === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['idleDuration'],
                message: 'idleDuration is required when bandEnable is true.',
            });
        }
    }
});

export function registerSetApPowerSavingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setApPowerSaving',
        {
            description: 'Update power saving settings for a specific Omada access point after checking feature support.',
            inputSchema: baseInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setApPowerSaving',
            ({ apMac, siteId }, result, mode) => ({
                action: 'set-ap-power-saving',
                target: apMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned AP power-saving update for ${apMac}.` : `AP power-saving update requested for ${apMac}.`,
                result,
            }),
            async (args) => {
                const { apMac, siteId, customHeaders, dryRun } = inputSchema.parse(args);
                const powerSavingPayload: ApPowerSavingPayload = {
                    timeEnable: args.timeEnable,
                    startTimeH: args.startTimeH,
                    startTimeM: args.startTimeM,
                    endTimeH: args.endTimeH,
                    endTimeM: args.endTimeM,
                    bandEnable: args.bandEnable,
                    bands: args.bands,
                    idleDuration: args.idleDuration,
                };
                const current = (await client.getSitesApsPowerSaving(apMac, siteId, customHeaders)) as { supportPowerSaving?: boolean };
                if (current.supportPowerSaving === false) {
                    throw new Error(`AP ${apMac} does not support power-saving configuration.`);
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before: current,
                        plannedConfig: powerSavingPayload,
                    };
                }

                return await client.setSitesApsPowerSaving(apMac, powerSavingPayload, siteId, customHeaders);
            }
        )
    );
}
