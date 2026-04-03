import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

const apConfigTypeSchema = z.enum([
    'general-config',
    'ip-setting',
    'ipv6-setting',
    'qos',
    'radio-config',
    'service-config',
    'load-balance',
    'ofdma',
    'trunk-setting',
    'bridge',
    'wlan-group',
    'port-config',
    'channel-config',
    'afc-config',
    'antenna-gain',
]);

type ApConfigType = z.infer<typeof apConfigTypeSchema>;
type ApConfigPayload = Record<string, unknown>;
type CustomHeaders = Record<string, string> | undefined;

const nonEmptyRecordSchema = z.record(z.string(), z.unknown()).superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'payload must include at least one field.',
        });
    }
});

const serviceConfigPayloadSchema = nonEmptyRecordSchema;
const wlanGroupPayloadSchema = nonEmptyRecordSchema.superRefine((value, ctx) => {
    const hasWlanId = typeof value['wlanId'] === 'string' && value['wlanId'].trim().length > 0;
    const hasWlanIds = Array.isArray(value['wlanIds']) && value['wlanIds'].length > 0;
    if (!hasWlanId && !hasWlanIds) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'wlan-group payload must include wlanId or wlanIds.',
        });
    }
});
const channelConfigPayloadSchema = nonEmptyRecordSchema;

const inputSchema = siteInputSchema.extend({
    apMac: deviceMacSchema.describe('MAC address of the access point to update.'),
    configType: apConfigTypeSchema.describe('Documented AP configuration family to update through the official Omada Open API.'),
    payload: z.record(z.string(), z.unknown()).describe('Configuration payload that matches the selected AP configType in the Omada Open API.'),
    dryRun: z.boolean().optional().default(false).describe('If true, validate the AP and return the planned update without applying it.'),
});

function parseApPayload(configType: ApConfigType, payload: unknown): ApConfigPayload {
    switch (configType) {
        case 'service-config':
            return serviceConfigPayloadSchema.parse(payload);
        case 'wlan-group':
            return wlanGroupPayloadSchema.parse(payload);
        case 'channel-config':
            return channelConfigPayloadSchema.parse(payload);
        default:
            return z.record(z.string(), z.unknown()).parse(payload);
    }
}

function hasReadback(configType: ApConfigType): boolean {
    return !['service-config', 'wlan-group', 'channel-config'].includes(configType);
}

async function validateApConfigCapability(
    client: OmadaClient,
    configType: ApConfigType,
    apMac: string,
    payload: ApConfigPayload,
    siteId?: string,
    customHeaders?: CustomHeaders
): Promise<void> {
    if (configType !== 'channel-config') {
        return;
    }

    const availableChannels = (await client.getSitesApsAvailableChannel(apMac, siteId, customHeaders)) as Record<string, unknown>;
    if (Object.keys(availableChannels).length === 0) {
        throw new Error(`AP ${apMac} does not expose available channel data for channel-config validation.`);
    }

    const payloadText = JSON.stringify(payload);
    if (!payloadText || payloadText === '{}') {
        throw new Error('channel-config payload must include at least one channel-related field.');
    }
}

async function getDeviceSummary(client: OmadaClient, apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
    const device = await client.getDevice(apMac, siteId, customHeaders);
    if (!device) {
        throw new Error(`AP ${apMac} was not found in the selected site.`);
    }
    return device;
}

async function getCurrentApConfig(
    client: OmadaClient,
    configType: ApConfigType,
    apMac: string,
    siteId?: string,
    customHeaders?: CustomHeaders
): Promise<unknown> {
    switch (configType) {
        case 'general-config':
            return await client.getApGeneralConfig(apMac, siteId, customHeaders);
        case 'ip-setting':
            return await client.getSitesApsIpSetting(apMac, siteId, customHeaders);
        case 'ipv6-setting':
            return await client.getApIpv6Config(apMac, siteId, customHeaders);
        case 'qos':
            return await client.getApQosConfig(apMac, siteId, customHeaders);
        case 'radio-config':
            return await client.getRadiosConfig(apMac, siteId, customHeaders);
        case 'load-balance':
            return await client.getSitesApsLoadBalance(apMac, siteId, customHeaders);
        case 'ofdma':
            return await client.getSitesApsOfdma(apMac, siteId, customHeaders);
        case 'trunk-setting':
            return await client.getSitesApsTrunkSetting(apMac, siteId, customHeaders);
        case 'bridge':
            return await client.getSitesApsBridge(apMac, siteId, customHeaders);
        case 'port-config':
            return await client.listSitesApsPorts(apMac, siteId, customHeaders);
        case 'afc-config':
            return await client.getAfcConfig(apMac, siteId, customHeaders);
        case 'antenna-gain':
            return await client.getAntennaGainConfig(apMac, siteId, customHeaders);
        default:
            return null;
    }
}

async function applyApConfig(
    client: OmadaClient,
    configType: ApConfigType,
    apMac: string,
    payload: ApConfigPayload,
    siteId?: string,
    customHeaders?: CustomHeaders
): Promise<unknown> {
    switch (configType) {
        case 'general-config':
            return await client.setApGeneralConfig(apMac, payload, siteId, customHeaders);
        case 'ip-setting':
            return await client.setSitesApsIpSetting(apMac, payload, siteId, customHeaders);
        case 'ipv6-setting':
            return await client.setApIpv6Config(apMac, payload, siteId, customHeaders);
        case 'qos':
            return await client.setApQosConfig(apMac, payload, siteId, customHeaders);
        case 'radio-config':
            return await client.setRadiosConfig(apMac, payload, siteId, customHeaders);
        case 'service-config':
            return await client.setApServiceConfig(apMac, payload, siteId, customHeaders);
        case 'load-balance':
            return await client.setSitesApsLoadBalance(apMac, payload, siteId, customHeaders);
        case 'ofdma':
            return await client.setSitesApsOfdma(apMac, payload, siteId, customHeaders);
        case 'trunk-setting':
            return await client.setSitesApsTrunkSetting(apMac, payload, siteId, customHeaders);
        case 'bridge':
            return await client.setSitesApsBridge(apMac, payload, siteId, customHeaders);
        case 'wlan-group':
            return await client.setApWlanGroup(apMac, payload, siteId, customHeaders);
        case 'port-config':
            return await client.setSitesApsPortConfig(apMac, payload, siteId, customHeaders);
        case 'channel-config':
            return await client.setApChannelConfig(apMac, payload, siteId, customHeaders);
        case 'afc-config':
            return await client.setAfcConfig(apMac, payload, siteId, customHeaders);
        case 'antenna-gain':
            return await client.setAntennaGainConfig(apMac, payload, siteId, customHeaders);
    }
}

export function registerSetApConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setApConfig',
        {
            description:
                'Update a documented Omada AP configuration family with dry-run support. Covers general, IP, IPv6, QoS, radio, service, load-balance, OFDMA, trunk, bridge, WLAN group, port, channel, AFC, and antenna settings.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setApConfig',
            ({ apMac, configType, siteId }, result, mode) => ({
                action: 'set-ap-config',
                target: apMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned ${configType} update for AP ${apMac}.` : `${configType} update requested for AP ${apMac}.`,
                result,
            }),
            async ({ apMac, configType, payload, siteId, customHeaders, dryRun }) => {
                const resolvedConfigType = configType as ApConfigType;
                const parsedPayload = parseApPayload(resolvedConfigType, payload);
                const device = await getDeviceSummary(client, apMac, siteId, customHeaders);
                await validateApConfigCapability(client, resolvedConfigType, apMac, parsedPayload, siteId, customHeaders);
                const beforeAvailable = hasReadback(resolvedConfigType);
                const before = beforeAvailable ? await getCurrentApConfig(client, resolvedConfigType, apMac, siteId, customHeaders) : null;

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        device,
                        configType: resolvedConfigType,
                        before,
                        beforeAvailable,
                        ...(beforeAvailable ? {} : { warning: 'Current controller state cannot be previewed for this config family before apply.' }),
                        plannedConfig: parsedPayload,
                    };
                }

                const result = await applyApConfig(client, resolvedConfigType, apMac, parsedPayload, siteId, customHeaders);
                return {
                    device,
                    configType: resolvedConfigType,
                    before,
                    beforeAvailable,
                    applied: result,
                };
            }
        )
    );
}
