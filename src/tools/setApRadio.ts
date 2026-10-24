import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { type ApRadiosConfig, apRadioSettingSchema } from '../omadaClient/device.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { applyWithVerification, compareRequestedFields } from '../utils/verification.js';

const bands = {
    '2.4GHz': { key: 'radioSetting2g', id: 0 },
    '5GHz': { key: 'radioSetting5g', id: 1 },
    '5GHz-1': { key: 'radioSetting5g1', id: 1 },
    '5GHz-2': { key: 'radioSetting5g2', id: 2 },
    '6GHz': { key: 'radioSetting6g', id: 3 },
} as const;

const channelDetailSchema = z.object({
    channel: z.number().int(),
    freq: z.number().int().positive().optional(),
    index: z.number().int().positive().optional(),
    availableChannelWidthList: z.array(z.number().int()).optional(),
});
const availableRadioSchema = z.object({ radioId: z.number().int().min(0).max(3), apChannelDetailList: z.array(channelDetailSchema) });

/** The tag spec describes one radio object. Controllers may return a list of those objects. */
export function parseAvailableChannels(value: unknown): z.infer<typeof availableRadioSchema>[] {
    return z.array(availableRadioSchema).parse(Array.isArray(value) ? value : [value]);
}

/** Pick documented writable fields only; absent/null bands are unsupported. */
export function projectRadioConfig(value: unknown): ApRadiosConfig {
    const source = z.record(z.unknown()).parse(value);
    const result: ApRadiosConfig = {};
    for (const { key } of Object.values(bands)) {
        if (source[key] !== undefined && source[key] !== null) result[key] = apRadioSettingSchema.strip().parse(source[key]);
    }
    return result;
}

const inputSchema = siteInputSchema.extend({
    apMac: deviceMacSchema,
    band: z.enum(['2.4GHz', '5GHz', '5GHz-1', '5GHz-2', '6GHz']),
    radioEnable: z.boolean().optional(),
    channel: z.number().int().positive().optional().describe('Fixed channel number, not the controller channel index. Must be advertised by the AP.'),
    channelWidthMHz: z.union([z.literal(20), z.literal(40), z.literal(80), z.literal(160), z.literal(240), z.literal(320)]).optional(),
    txPowerLevel: z
        .union([z.literal(0), z.literal(1), z.literal(2), z.literal(4)])
        .optional()
        .describe('0 low, 1 medium, 2 high, 4 auto. Custom dBm is excluded because the spec supplies no device power limits.'),
    dryRun: z.boolean().default(true),
});

const widthCodes = { 20: '2', 40: '3', 80: '5', 160: '7', 240: '9', 320: '10' } as const;

export function registerSetApRadioTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setApRadio',
        {
            description:
                'Update one supported AP radio using official radio-config and available-channel data. Preserves sibling bands and verifies readback. Radio changes can disconnect wireless clients. Defaults to a dry run.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler(
            'setApRadio',
            ({ apMac, siteId }, result, mode) => ({
                action: 'set-ap-radio',
                target: apMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'submitted',
                summary: `AP radio update ${mode === 'dry-run' ? 'planned' : 'processed'} for ${apMac}.`,
                result,
            }),
            async (args) => {
                const { apMac, band, siteId, customHeaders, radioEnable, channel, channelWidthMHz, txPowerLevel, dryRun } = inputSchema.parse(args);
                if (radioEnable === undefined && channel === undefined && channelWidthMHz === undefined && txPowerLevel === undefined) {
                    throw new Error('At least one radio setting is required.');
                }
                const read = async (): Promise<ApRadiosConfig> => projectRadioConfig(await client.getRadiosConfig(apMac, siteId, customHeaders));
                const before = await read();
                const { key, id } = bands[band];
                const current = before[key];
                if (!current || Object.keys(current).length === 0) throw new Error(`AP does not expose a supported ${band} radio.`);
                const available = parseAvailableChannels(await client.getSitesApsAvailableChannel(apMac, siteId, customHeaders));
                const capabilities = available.find((radio) => radio.radioId === id);
                if (!capabilities || capabilities.apChannelDetailList.length === 0)
                    throw new Error(`No channel capabilities are available for ${band}.`);

                const changes: z.infer<typeof apRadioSettingSchema> = {};
                if (radioEnable !== undefined) changes.radioEnable = radioEnable;
                if (txPowerLevel !== undefined) changes.txPowerLevel = txPowerLevel;
                const selectedChannel =
                    channel === undefined
                        ? capabilities.apChannelDetailList.find((item) => String(item.index) === current.channel)
                        : capabilities.apChannelDetailList.find((item) => item.channel === channel);
                if (channel !== undefined) {
                    if (!selectedChannel?.index || !selectedChannel.freq)
                        throw new Error('Requested channel has no documented index/frequency mapping on this AP.');
                    changes.channel = String(selectedChannel.index);
                    changes.freq = selectedChannel.freq;
                }
                if (channelWidthMHz !== undefined) changes.channelWidth = widthCodes[channelWidthMHz];
                // Validate an explicitly selected width and any retained fixed width when the channel changes.
                const widthCode = changes.channelWidth ?? current.channelWidth;
                const fixedWidth = Object.entries(widthCodes).find(([, code]) => code === widthCode)?.[0];
                if (channelWidthMHz !== undefined || (channel !== undefined && fixedWidth !== undefined)) {
                    if (!selectedChannel?.availableChannelWidthList?.includes(Number(fixedWidth))) {
                        throw new Error(
                            'Requested channel/width combination is not advertised by this AP; select a fixed channel with a supported width.'
                        );
                    }
                }
                const plannedConfig: ApRadiosConfig = { ...before, [key]: { ...current, ...changes } };
                if (dryRun) return { accepted: true, dryRun: true, before, plannedConfig };
                if (compareRequestedFields(plannedConfig, before).status !== 'verified') {
                    // Reduce stale read-modify-write risk. The API exposes no atomic compare-and-set.
                    const fresh = await read();
                    if (compareRequestedFields(before, fresh).status !== 'verified' || compareRequestedFields(fresh, before).status !== 'verified')
                        throw new Error('Radio configuration changed during planning; read it again before applying.');
                }
                return {
                    before,
                    plannedConfig,
                    ...(await applyWithVerification({
                        requested: plannedConfig,
                        before,
                        read,
                        write: () => client.setRadiosConfig(apMac, plannedConfig, siteId, customHeaders),
                    })),
                };
            }
        )
    );
}
