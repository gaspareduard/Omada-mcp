import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

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

const inputSchema = siteInputSchema.extend({
    gatewayMac: deviceMacSchema.describe('MAC address of the gateway to update.'),
    configType: gatewayConfigTypeSchema.describe('Documented gateway configuration family to update through the official Omada Open API.'),
    portName: z.string().trim().min(1).optional().describe('Gateway port identifier. Required when configType is port-config.'),
    payload: z.record(z.string(), z.unknown()).describe('Configuration payload that matches the selected gateway configType in the Omada Open API.'),
    dryRun: z.boolean().optional().default(false).describe('If true, validate the gateway and return the planned update without applying it.'),
});

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
            if (!portName) {
                throw new Error('portName is required when configType is port-config.');
            }
            return await client.setSitesGatewaysPortConfig(gatewayMac, portName, payload, siteId, customHeaders);
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
            async ({ gatewayMac, configType, portName, payload, siteId, customHeaders, dryRun }) => {
                const resolvedConfigType = configType as GatewayConfigType;
                const gateway = await getGatewaySummary(client, gatewayMac, siteId, customHeaders);
                const before = await getCurrentGatewayConfig(client, resolvedConfigType, gatewayMac, siteId, customHeaders);

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        gateway,
                        configType: resolvedConfigType,
                        portName: portName ?? null,
                        before,
                        plannedConfig: payload,
                    };
                }

                const result = await applyGatewayConfig(client, resolvedConfigType, gatewayMac, payload, siteId, customHeaders, portName);
                return {
                    gateway,
                    configType: resolvedConfigType,
                    portName: portName ?? null,
                    before,
                    applied: result,
                };
            }
        )
    );
}
