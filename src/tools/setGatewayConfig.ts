import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { apRadioSettingSchema } from '../omadaClient/device.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { applyWithVerification, compareRequestedFields } from '../utils/verification.js';

const gatewayConfigTypeSchema = z.enum([
    'general-config',
    'config-general',
    'config-services',
    'config-advanced',
    'config-radios',
    'config-wlans',
    'port-config',
    'multi-port-config',
]);

type GatewayConfigType = z.infer<typeof gatewayConfigTypeSchema>;
type GatewayConfigPayload = Record<string, unknown>;
type CustomHeaders = Record<string, string> | undefined;

// Strict request contracts from docs/openapi/03-device.json (including nested objects).
const deviceLocationDetailVOSchema = z
    .object({
        longitude: z.number().finite().optional(),
        latitude: z.number().finite().optional(),
        address: z.string().optional(),
    })
    .strict();
const gatewayGeneralConfigSchema = z
    .object({
        name: z.string().regex(new RegExp('^(?:^[^ \\+\\-\\@\\=]$|^[^ \\+\\-\\@\\=].{0,126}[^ ]$)$')).optional(),
        ledSetting: z.number().int().min(0).max(2),
        tagIds: z.array(z.string()).optional(),
        location: deviceLocationDetailVOSchema.optional(),
    })
    .strict();
const osgSnmpOpenApiVOSchema = z
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
const osgConfigServicesOpenApiVOSchema = z
    .object({
        snmp: osgSnmpOpenApiVOSchema.optional(),
    })
    .strict();
const osgPortPoeOpenApiVOSchema = z
    .object({
        portId: z.number().int().optional(),
        portName: z.boolean().optional(),
    })
    .strict();
const apLoadBalanceOpenApiVOSchema = z
    .object({
        lbEnable: z.boolean().optional(),
        maxClients: z.number().int().optional(),
    })
    .strict();
const apRssiThresholdOpenApiVOSchema = z
    .object({
        rssiEnable: z.boolean().optional(),
        threshold: z.number().int().optional(),
    })
    .strict();
const apQosOpenApiVOSchema = z
    .object({
        wmmEnable: z.boolean().optional(),
        noAcknowledgement: z.boolean().optional(),
        deliveryEnable: z.boolean().optional(),
    })
    .strict();
const osgConfigAdvancedOpenApiVOSchema = z
    .object({
        hwOffloadEnable: z.boolean().optional(),
        lldpEnable: z.boolean().optional(),
        poeSettings: z.array(osgPortPoeOpenApiVOSchema).optional(),
        echoServer: z
            .string()
            .regex(
                /^(?:(?:\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(?:\.(?:\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6})$/
            )
            .optional(),
        lbSetting2g: apLoadBalanceOpenApiVOSchema.optional(),
        lbSetting5g: apLoadBalanceOpenApiVOSchema.optional(),
        lbSetting5g1: apLoadBalanceOpenApiVOSchema.optional(),
        lbSetting5g2: apLoadBalanceOpenApiVOSchema.optional(),
        lbSetting6g: apLoadBalanceOpenApiVOSchema.optional(),
        rssiSetting2g: apRssiThresholdOpenApiVOSchema.optional(),
        rssiSetting5g: apRssiThresholdOpenApiVOSchema.optional(),
        rssiSetting5g1: apRssiThresholdOpenApiVOSchema.optional(),
        rssiSetting5g2: apRssiThresholdOpenApiVOSchema.optional(),
        rssiSetting6g: apRssiThresholdOpenApiVOSchema.optional(),
        qosSetting2g: apQosOpenApiVOSchema.optional(),
        qosSetting5g: apQosOpenApiVOSchema.optional(),
        qosSetting5g1: apQosOpenApiVOSchema.optional(),
        qosSetting5g2: apQosOpenApiVOSchema.optional(),
        qosSetting6g: apQosOpenApiVOSchema.optional(),
        ofdmaEnable2g: z.boolean().optional(),
        ofdmaEnable5g: z.boolean().optional(),
        ofdmaEnable5g1: z.boolean().optional(),
        ofdmaEnable5g2: z.boolean().optional(),
        ofdmaEnable6g: z.boolean().optional(),
    })
    .strict();
const osgConfigRadiosopenApiVOSchema = z
    .object({
        radioSetting2g: apRadioSettingSchema.extend({ nonPscEnable: z.boolean().optional() }).optional(),
        radioSetting5g: apRadioSettingSchema.extend({ nonPscEnable: z.boolean().optional() }).optional(),
        radioSetting5g1: apRadioSettingSchema.extend({ nonPscEnable: z.boolean().optional() }).optional(),
        radioSetting5g2: apRadioSettingSchema.extend({ nonPscEnable: z.boolean().optional() }).optional(),
        radioSetting6g: apRadioSettingSchema.extend({ nonPscEnable: z.boolean().optional() }).optional(),
    })
    .strict();
const osgSsidOverrideOpenApiVOSchema = z
    .object({
        index: z.number().int(),
        globalSsid: z.string(),
        bandInfo: z.number().int().min(1).max(7).optional(),
        supportBands: z.array(z.number().int()).optional(),
        security: z.number().int(),
        enable: z.boolean(),
        vlanEnable: z.boolean(),
        vlanId: z.number().int().min(1).max(4094).optional(),
        ssid: z.string(),
        psk: z.string().optional(),
        ssidEnable: z.boolean(),
        hidePwd: z.boolean(),
    })
    .strict();
const osgConfigWlansOpenApiVOSchema = z
    .object({
        wlanId: z.string().trim().min(1).optional(),
        ssidOverrides: z.array(osgSsidOverrideOpenApiVOSchema),
        wlansResource: z.number().int().optional(),
    })
    .strict();
const dslSettingsSchema = z
    .object({
        modulationType: z.union([z.literal(0), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).optional(),
        annexType: z.number().int().min(0).max(8).optional(),
        bitSwap: z.number().int().min(0).max(1).optional(),
        sra: z.number().int().min(0).max(1).optional(),
    })
    .strict();
const gatewayPortSettingConfigSchema = z
    .object({
        linkSpeed: z.number().int().min(0).max(6).optional(),
        duplex: z.number().int().min(0).max(2).optional(),
        mirrorEnable: z.boolean().optional(),
        mirroredPorts: z.array(z.number().int()).optional(),
        mirrorMode: z.number().int().min(0).max(2).optional(),
        pvid: z.number().int().min(1).max(4094).optional(),
        flowControl: z.boolean().optional(),
        status: z.number().int().min(0).max(1).optional(),
        poeMode: z.number().int().min(0).max(1).optional(),
        dslSettings: dslSettingsSchema.optional(),
    })
    .strict();
const gatewayPortConfigSchema = z
    .object({
        port: z.number().int(),
        linkSpeed: z.number().int().min(0).max(6).optional(),
        duplex: z.number().int().min(0).max(2).optional(),
        mirrorEnable: z.boolean().optional(),
        mirroredPorts: z.array(z.number().int()).optional(),
        mirrorMode: z.number().int().min(0).max(2).optional(),
        pvid: z.number().int().min(1).max(4094).optional(),
        flowControl: z.boolean().optional(),
        status: z.number().int().min(0).max(1).optional(),
        dslSettings: dslSettingsSchema.optional(),
    })
    .strict();
const gatewayportsconfigentitySchema = z
    .object({
        portsConfig: z.array(gatewayPortConfigSchema).min(1).optional(),
    })
    .strict();

const gatewayPayloadSchemas = {
    'general-config': gatewayGeneralConfigSchema,
    'config-general': gatewayGeneralConfigSchema,
    'config-services': osgConfigServicesOpenApiVOSchema,
    'config-advanced': osgConfigAdvancedOpenApiVOSchema,
    'config-radios': osgConfigRadiosopenApiVOSchema,
    'config-wlans': osgConfigWlansOpenApiVOSchema,
    'port-config': gatewayPortSettingConfigSchema,
    'multi-port-config': gatewayportsconfigentitySchema,
};

const inputSchema = siteInputSchema.extend({
    gatewayMac: deviceMacSchema.describe('MAC address of the gateway to update.'),
    configType: gatewayConfigTypeSchema.describe('Documented gateway configuration family to update through the official Omada Open API.'),
    portName: z.string().trim().min(1).optional().describe('Gateway port identifier. Required when configType is port-config.'),
    payload: z.record(z.string(), z.unknown()).describe('Configuration payload that matches the selected gateway configType in the Omada Open API.'),
    dryRun: z.boolean().optional().default(true).describe('If true, validate the gateway and return the planned update without applying it.'),
});

export function parseGatewayPayload(configType: GatewayConfigType, payload: unknown): GatewayConfigPayload {
    const parsed = gatewayPayloadSchemas[configType].parse(payload);
    if (compareRequestedFields(parsed, parsed).status !== 'verified') throw new Error('payload must include at least one field.');
    return parsed;
}

async function getGatewaySummary(client: OmadaClient, gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
    const device = await client.getDevice(gatewayMac, siteId, customHeaders);
    if (!device) {
        throw new Error(`Gateway ${gatewayMac} was not found in the selected site.`);
    }
    return device;
}

async function getCurrentGatewayConfig(
    client: OmadaClient,
    configType: GatewayConfigType,
    gatewayMac: string,
    siteId?: string,
    customHeaders?: CustomHeaders
): Promise<unknown> {
    if (configType === 'general-config') {
        return await client.getSitesGatewaysGeneralConfig(gatewayMac, siteId, customHeaders);
    }

    return null;
}

function hasReadback(configType: GatewayConfigType): boolean {
    return configType === 'general-config';
}

async function applyGatewayConfig(
    client: OmadaClient,
    configType: GatewayConfigType,
    gatewayMac: string,
    payload: GatewayConfigPayload,
    siteId?: string,
    customHeaders?: CustomHeaders,
    portName?: string
): Promise<unknown> {
    switch (configType) {
        case 'general-config':
            return await client.setSitesGatewaysGeneralConfig(gatewayMac, payload, siteId, customHeaders);
        case 'config-general':
            return await client.setSitesGatewaysConfigGeneral(gatewayMac, payload, siteId, customHeaders);
        case 'config-services':
            return await client.setSitesGatewaysConfigServices(gatewayMac, payload, siteId, customHeaders);
        case 'config-advanced':
            return await client.setSitesGatewaysConfigAdvanced(gatewayMac, payload, siteId, customHeaders);
        case 'config-radios':
            return await client.setSitesGatewaysConfigRadios(gatewayMac, payload, siteId, customHeaders);
        case 'config-wlans':
            return await client.setSitesGatewaysConfigWlans(gatewayMac, payload, siteId, customHeaders);
        case 'port-config':
            return await client.setSitesGatewaysPortConfig(gatewayMac, portName as string, payload, siteId, customHeaders);
        case 'multi-port-config':
            return await client.setSitesGatewaysMultiPortsConfig(gatewayMac, payload, siteId, customHeaders);
    }
}

export function registerSetGatewayConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'setGatewayConfig',
        {
            description:
                'Update a documented Omada gateway configuration family with dry-run support. Covers general, services, advanced, radios, WLAN, and port settings through the official Open API.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'setGatewayConfig',
            ({ gatewayMac, configType, siteId }, result, mode) => ({
                action: 'set-gateway-config',
                target: gatewayMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned ${configType} update for gateway ${gatewayMac}.`
                        : `${configType} update requested for gateway ${gatewayMac}.`,
                result,
            }),
            async (args) => {
                const { gatewayMac, configType, portName, payload, siteId, customHeaders, dryRun } = inputSchema.parse(args);
                const resolvedConfigType = configType as GatewayConfigType;
                if (resolvedConfigType === 'port-config' && !portName) {
                    throw new Error('portName is required when configType is port-config.');
                }
                const parsedPayload = parseGatewayPayload(resolvedConfigType, payload);
                const gateway = await getGatewaySummary(client, gatewayMac, siteId, customHeaders);
                const beforeAvailable = hasReadback(resolvedConfigType);
                const before = beforeAvailable ? await getCurrentGatewayConfig(client, resolvedConfigType, gatewayMac, siteId, customHeaders) : null;

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        gateway,
                        configType: resolvedConfigType,
                        portName: portName ?? null,
                        before,
                        beforeAvailable,
                        ...(beforeAvailable ? {} : { warning: 'Current controller state cannot be previewed for this config family before apply.' }),
                        plannedConfig: parsedPayload,
                    };
                }

                const result = await applyWithVerification({
                    requested: parsedPayload,
                    before: beforeAvailable ? before : undefined,
                    write: () => applyGatewayConfig(client, resolvedConfigType, gatewayMac, parsedPayload, siteId, customHeaders, portName),
                    read: beforeAvailable ? () => getCurrentGatewayConfig(client, resolvedConfigType, gatewayMac, siteId, customHeaders) : undefined,
                });
                return {
                    gateway,
                    configType: resolvedConfigType,
                    portName: portName ?? null,
                    before,
                    beforeAvailable,
                    ...result,
                };
            }
        )
    );
}
