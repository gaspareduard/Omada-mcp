import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetGatewayConfigTool } from '../../src/tools/setGatewayConfig.js';

describe('tools/setGatewayConfig', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getDevice: vi.fn().mockResolvedValue({ mac: 'AA:BB:CC:DD:EE:FF', type: 'gateway', name: 'ER605' }),
            getSitesGatewaysGeneralConfig: vi.fn().mockResolvedValue({ mtu: 1500 }),
            setSitesGatewaysGeneralConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesGatewaysConfigGeneral: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesGatewaysConfigServices: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesGatewaysConfigAdvanced: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesGatewaysConfigRadios: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesGatewaysConfigWlans: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesGatewaysMultiPortsConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesGatewaysPortConfig: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary for gateway config changes', async () => {
        registerSetGatewayConfigTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                gatewayMac: 'AA:BB:CC:DD:EE:FF',
                configType: 'general-config',
                payload: { mtu: 1492 },
                dryRun: true,
            },
            { sessionId: 's1' }
        );

        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-gateway-config',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned general-config update for gateway AA:BB:CC:DD:EE:FF.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                gateway: { mac: 'AA:BB:CC:DD:EE:FF', type: 'gateway', name: 'ER605' },
                                configType: 'general-config',
                                portName: null,
                                before: { mtu: 1500 },
                                plannedConfig: { mtu: 1492 },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('applies a gateway services config update', async () => {
        registerSetGatewayConfigTool(mockServer, mockClient);

        await toolHandler(
            {
                gatewayMac: 'AA:BB:CC:DD:EE:FF',
                configType: 'config-services',
                payload: { sshEnable: true },
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setSitesGatewaysConfigServices).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', { sshEnable: true }, 'site-1', undefined);
    });

    it.each([
        ['general-config', 'getSitesGatewaysGeneralConfig', 'setSitesGatewaysGeneralConfig'],
        ['config-general', null, 'setSitesGatewaysConfigGeneral'],
        ['config-services', null, 'setSitesGatewaysConfigServices'],
        ['config-advanced', null, 'setSitesGatewaysConfigAdvanced'],
        ['config-radios', null, 'setSitesGatewaysConfigRadios'],
        ['config-wlans', null, 'setSitesGatewaysConfigWlans'],
        ['multi-port-config', null, 'setSitesGatewaysMultiPortsConfig'],
    ])('supports the %s gateway config branch', async (configType, getterName, setterName) => {
        registerSetGatewayConfigTool(mockServer, mockClient);

        await toolHandler(
            {
                gatewayMac: 'AA:BB:CC:DD:EE:FF',
                configType,
                payload: { enabled: true },
            },
            { sessionId: 's1' }
        );

        if (getterName) {
            expect(mockClient[getterName as keyof OmadaClient] as ReturnType<typeof vi.fn>).toHaveBeenCalled();
        }
        expect(mockClient[setterName as keyof OmadaClient] as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
            'AA:BB:CC:DD:EE:FF',
            { enabled: true },
            undefined,
            undefined
        );
    });

    it('requires portName for port-config updates', async () => {
        registerSetGatewayConfigTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    gatewayMac: 'AA:BB:CC:DD:EE:FF',
                    configType: 'port-config',
                    payload: { profileId: 'wan-main' },
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('portName is required when configType is port-config.');
    });
});
