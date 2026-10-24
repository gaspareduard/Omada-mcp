import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { apRadiosConfigSchema } from '../omadaClient/device.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { applyWithVerification, compareRequestedFields } from '../utils/verification.js';
import { parseAvailableChannels } from './setApRadio.js';

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

// Strict request contracts from docs/openapi/03-device.json (including nested objects).
const apRssiLedSettingVOSchema = z
    .object({
        ledId: z.string().optional(),
        threshold: z.number().int().optional(),
    })
    .strict();
const deviceLocationDetailVOSchema = z
    .object({
        longitude: z.number().finite().optional(),
        latitude: z.number().finite().optional(),
        address: z.string().optional(),
    })
    .strict();
const apGeneralConfigSchema = z
    .object({
        name: z.string().regex(new RegExp('^(?:^[^ \\+\\-\\@\\=]$|^[^ \\+\\-\\@\\=].{0,126}[^ ]$)$')).optional(),
        ledSetting: z.number().int().min(0).max(2).optional(),
        remoteReset: z.boolean().optional(),
        wifiControlEnable: z.boolean().optional(),
        rssiLedSettings: z.array(apRssiLedSettingVOSchema).optional(),
        tagIds: z.array(z.string()).optional(),
        gpsEnable: z.boolean().optional(),
        location: deviceLocationDetailVOSchema.optional(),
        rememberDevice: z.number().int().min(0).max(2).optional(),
        disableHwReset: z.boolean().optional(),
    })
    .strict();
const dhcpipsettingentitySchema = z
    .object({
        fallback: z.boolean().optional(),
        fallbackIp: z.string().ip({ version: 'v4' }).optional(),
        fallbackMask: z.string().ip({ version: 'v4' }).optional(),
        fallbackGate: z.string().ip({ version: 'v4' }).optional(),
        useFixedAddr: z.boolean().optional(),
        netId: z.string().trim().min(1).optional(),
        dhcpIp: z.string().ip({ version: 'v4' }).optional(),
    })
    .strict();
const staticipsettingentitySchema = z
    .object({
        configIp: z.string().ip({ version: 'v4' }).optional(),
        configMask: z.string().ip({ version: 'v4' }).optional(),
        configGate: z.string().ip({ version: 'v4' }).optional(),
        preferredDNS: z.string().ip({ version: 'v4' }).optional(),
        alternateDNS: z.string().ip({ version: 'v4' }).optional(),
    })
    .strict();
const apIPSettingSchema = z
    .object({
        mode: z.enum(['static', 'dhcp']),
        dhcpIpSetting: dhcpipsettingentitySchema.optional(),
        staticIpSetting: staticipsettingentitySchema.optional(),
    })
    .strict();
const dynamicipv6settingentitySchema = z
    .object({
        dnsMode: z.number().int().min(0).max(1),
        priDns: z.string().ip({ version: 'v6' }).optional(),
        sndDns: z.string().ip({ version: 'v6' }).optional(),
    })
    .strict();
const staticipv6settingentitySchema = z
    .object({
        ipv6Addr: z.string().ip({ version: 'v6' }),
        prefixLen: z.number().int().min(0).max(128),
        defaultGate: z.string().ip({ version: 'v6' }).optional(),
        priDns: z.string().ip({ version: 'v6' }).optional(),
        sndDns: z.string().ip({ version: 'v6' }).optional(),
    })
    .strict();
const apIPv6SettingSchema = z
    .object({
        ipv6Enable: z.boolean(),
        mode: z.enum(['dynamic', 'static']).optional(),
        dynamicIpv6Setting: dynamicipv6settingentitySchema.optional(),
        staticIpv6Setting: staticipv6settingentitySchema.optional(),
    })
    .strict();
const modifyApAdvancedQosOpenApiVOSchema = z
    .object({
        deliveryEnable2g: z.boolean().optional(),
        deliveryEnable5g: z.boolean().optional(),
        deliveryEnable5g1: z.boolean().optional(),
        deliveryEnable5g2: z.boolean().optional(),
        deliveryEnable6g: z.boolean().optional(),
    })
    .strict();
const apMvlanSettingOpenApiVOSchema = z
    .object({
        mode: z.number().int().min(0).max(1),
        lanNetworkId: z.string().trim().min(1).optional(),
        bridgeVlan: z.number().int().min(1).max(4094).optional(),
    })
    .strict();
const apSnmpVOSchema = z
    .object({
        location: z
            .string()
            .regex(/^(?:[!-~](?:[ -~]{0,126}[!-~])?)?$/)
            .optional(),
        contact: z
            .string()
            .regex(/^[!-~]{0,128}$/)
            .optional(),
    })
    .strict();
const apL3AccessVOSchema = z
    .object({
        enable: z.boolean().optional(),
    })
    .strict();
const apVoipVlanSettingOpenApiVOSchema = z
    .object({
        mode: z.number().int().min(0).max(1),
        lanNetworkId: z.string().trim().min(1).optional(),
        voipBridgeVlan: z.number().int().min(1).max(4090).optional(),
        ipType: z.number().int().min(0).max(1).optional(),
        ip: z.string().ip({ version: 'v4' }).optional(),
        ipMask: z.string().ip({ version: 'v4' }).optional(),
        ipGateway: z.string().ip({ version: 'v4' }).optional(),
        ipDns1: z.string().ip({ version: 'v4' }).optional(),
        ipDns2: z.string().ip({ version: 'v4' }).optional(),
    })
    .strict();
const apServicesConfigOpenApiVOSchema = z
    .object({
        mvlanSetting: apMvlanSettingOpenApiVOSchema.optional(),
        snmp: apSnmpVOSchema.optional(),
        l3AccessSetting: apL3AccessVOSchema.optional(),
        lldpEnable: z.number().int().min(0).max(2).optional(),
        loopbackDetectEnable: z.boolean().optional(),
        voipVlanSetting: apVoipVlanSettingOpenApiVOSchema.optional(),
    })
    .strict();
const updateApAdvancedLoadBalanceOpenApiVOSchema = z
    .object({
        enable: z.boolean().optional(),
        maxClients2g: z.number().int().min(1).max(512).optional(),
        maxClients5g: z.number().int().min(1).max(512).optional(),
        maxClients5g1: z.number().int().min(1).max(512).optional(),
        maxClients5g2: z.number().int().min(1).max(512).optional(),
        maxClients6g: z.number().int().min(1).max(512).optional(),
    })
    .strict();
const updateApOfdmaConfigOpenApiVOSchema = z
    .object({
        ofdmaEnable2g: z.boolean().optional(),
        ofdmaEnable5g: z.boolean().optional(),
        ofdmaEnable5g2: z.boolean().optional(),
        ofdmaEnable6g: z.boolean().optional(),
    })
    .strict();
const updateApTrunkSettingOpenApiVOSchema = z
    .object({
        enable: z.boolean().optional(),
        mode: z.number().int().min(0).max(2).optional(),
    })
    .strict();
const apBridgeConfigSchema = z
    .object({
        bridgeSsidName: z.string().min(1).max(32),
        bridgeSsidPassword: z
            .string()
            .min(8)
            .max(63)
            .regex(/^[ -~]+$/),
    })
    .strict();
const apUpdateWlanGroupOpenApiVOSchema = z
    .object({
        wlanGroupId: z.string().trim().min(1),
    })
    .strict();
const oNUPortRateLimitVOSchema = z
    .object({
        status: z.boolean().optional(),
        rate: z.number().int().min(1).max(10240).optional(),
    })
    .strict();
const modifyAPLANPortSchema = z
    .object({
        lanPort: z.string().trim().min(1),
        name: z.string().optional(),
        status: z.boolean().optional(),
        localVlanEnable: z.boolean().optional(),
        localVlanId: z.number().int().min(1).max(4094).optional(),
        localVlanNetworkId: z.string().trim().min(1).optional(),
        poeOutEnable: z.boolean().optional(),
        custom: z.boolean().optional(),
        tagged: z.string().optional(),
        untagged: z.string().optional(),
        taggedNetworkId: z.array(z.string()).optional(),
        untaggedNetworkId: z.array(z.string()).optional(),
        bandwidthControlEnable: z.boolean().optional(),
        ingressRateLimit: oNUPortRateLimitVOSchema.optional(),
        egressRateLimit: oNUPortRateLimitVOSchema.optional(),
    })
    .strict();
const updateApChannelConfigOpenApiVOSchema = z
    .object({
        radioId: z.number().int().min(0).max(3),
        radioEnable: z.boolean(),
        channel: z.number().int().optional(),
        channelWidth: z.number().int().optional(),
    })
    .strict();
const updateAfcConfigOpenApiVOSchema = z
    .object({
        enable: z.boolean(),
    })
    .strict();
const updateApRadioAnteGainConfigOpenApiVOSchema = z
    .object({
        radioId: z.number().int().min(0).max(3),
        anteGain: z.number().int().min(0).max(30),
    })
    .strict();
const updateApAnteGainConfigSchema = z
    .object({
        anteGainList: z.array(updateApRadioAnteGainConfigOpenApiVOSchema).min(1).optional(),
    })
    .strict();

const apPayloadSchemas = {
    'general-config': apGeneralConfigSchema,
    'ip-setting': apIPSettingSchema,
    'ipv6-setting': apIPv6SettingSchema,
    qos: modifyApAdvancedQosOpenApiVOSchema,
    'radio-config': apRadiosConfigSchema,
    'service-config': apServicesConfigOpenApiVOSchema,
    'load-balance': updateApAdvancedLoadBalanceOpenApiVOSchema,
    ofdma: updateApOfdmaConfigOpenApiVOSchema,
    'trunk-setting': updateApTrunkSettingOpenApiVOSchema,
    bridge: apBridgeConfigSchema,
    'wlan-group': apUpdateWlanGroupOpenApiVOSchema,
    'port-config': modifyAPLANPortSchema,
    'channel-config': updateApChannelConfigOpenApiVOSchema,
    'afc-config': updateAfcConfigOpenApiVOSchema,
    'antenna-gain': updateApAnteGainConfigSchema,
};

const inputSchema = siteInputSchema.extend({
    apMac: deviceMacSchema.describe('MAC address of the access point to update.'),
    configType: apConfigTypeSchema.describe('Documented AP configuration family to update through the official Omada Open API.'),
    payload: z.record(z.string(), z.unknown()).describe('Configuration payload that matches the selected AP configType in the Omada Open API.'),
    dryRun: z.boolean().optional().default(true).describe('If true, validate the AP and return the planned update without applying it.'),
});

export function parseApPayload(configType: ApConfigType, payload: unknown): ApConfigPayload {
    const parsed = apPayloadSchemas[configType].parse(payload);
    if (compareRequestedFields(parsed, parsed).status !== 'verified') throw new Error('payload must include at least one field.');
    return parsed;
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

    const availableChannels = parseAvailableChannels(await client.getSitesApsAvailableChannel(apMac, siteId, customHeaders));
    const radio = availableChannels.find((item) => item.radioId === payload.radioId);
    if (!radio || radio.apChannelDetailList.length === 0) {
        throw new Error(`AP ${apMac} does not expose available channel data for channel-config validation.`);
    }
    const channels =
        payload.channel === undefined || payload.channel === 0
            ? radio.apChannelDetailList
            : radio.apChannelDetailList.filter((item) => item.channel === payload.channel);
    if (
        channels.length === 0 ||
        (typeof payload.channelWidth === 'number' &&
            payload.channelWidth !== 0 &&
            !channels.some((item) => item.availableChannelWidthList?.includes(payload.channelWidth as number)))
    ) {
        throw new Error('Requested channel/width combination is not advertised by this AP.');
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

/** 03-device.json reads the first split 5 GHz radio as *5g, but writes it as *5g1.
 * QoS documents support5g2; load-balance does not, so its capability comes from QoS.
 * Keep the original GET snapshot for previews and normalize only for comparison.
 */
function normalizeApReadback(configType: ApConfigType, value: unknown, loadBalanceSupports5gSplit: boolean): unknown {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
    const observed = value as Record<string, unknown>;
    const supports5gSplit = configType === 'qos' ? observed.support5g2 === true : configType === 'load-balance' && loadBalanceSupports5gSplit;
    if (!supports5gSplit) return value;

    const source = configType === 'qos' ? 'deliveryEnable5g' : 'maxClients5g';
    const target = configType === 'qos' ? 'deliveryEnable5g1' : 'maxClients5g1';
    const normalized = { ...observed };
    delete normalized[source];
    if (Object.hasOwn(observed, source)) normalized[target] = observed[source];
    return normalized;
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
            async (args) => {
                const { apMac, configType, payload, siteId, customHeaders, dryRun } = inputSchema.parse(args);
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

                // Port list GET has a different response shape; no speculative field mapping.
                const canVerify = beforeAvailable && resolvedConfigType !== 'port-config';
                let loadBalanceSupports5gSplit = false;
                if (resolvedConfigType === 'load-balance' && ('maxClients5g1' in parsedPayload || 'maxClients5g' in parsedPayload)) {
                    const capabilities = await client.getApQosConfig(apMac, siteId, customHeaders);
                    loadBalanceSupports5gSplit =
                        capabilities !== null &&
                        typeof capabilities === 'object' &&
                        !Array.isArray(capabilities) &&
                        (capabilities as Record<string, unknown>).support5g2 === true;
                }
                const result = await applyWithVerification({
                    requested: parsedPayload,
                    before: canVerify ? normalizeApReadback(resolvedConfigType, before, loadBalanceSupports5gSplit) : undefined,
                    write: () => applyApConfig(client, resolvedConfigType, apMac, parsedPayload, siteId, customHeaders),
                    read: canVerify
                        ? async () =>
                              normalizeApReadback(
                                  resolvedConfigType,
                                  await getCurrentApConfig(client, resolvedConfigType, apMac, siteId, customHeaders),
                                  loadBalanceSupports5gSplit
                              )
                        : undefined,
                });
                return {
                    device,
                    configType: resolvedConfigType,
                    before,
                    beforeAvailable,
                    ...result,
                };
            }
        )
    );
}
