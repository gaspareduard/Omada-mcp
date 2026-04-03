import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetApConfigTool } from '../../src/tools/setApConfig.js';

describe('tools/setApConfig', () => {
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
            getDevice: vi.fn().mockResolvedValue({ mac: 'AA:BB:CC:DD:EE:FF', type: 'ap', name: 'Birou AP' }),
            getApGeneralConfig: vi.fn().mockResolvedValue({ led: true }),
            getSitesApsIpSetting: vi.fn().mockResolvedValue({ mode: 'dhcp' }),
            getApIpv6Config: vi.fn().mockResolvedValue({ ipv6Enable: true }),
            getApQosConfig: vi.fn().mockResolvedValue({ qosEnable: true }),
            getRadiosConfig: vi.fn().mockResolvedValue({ radios: [] }),
            getSitesApsAvailableChannel: vi.fn().mockResolvedValue([{ radioId: 0, apChannelDetailList: [{ channel: 1 }] }]),
            getSitesApsLoadBalance: vi.fn().mockResolvedValue({ enabled: true }),
            getSitesApsOfdma: vi.fn().mockResolvedValue({ enabled: true }),
            getSitesApsTrunkSetting: vi.fn().mockResolvedValue({ profile: 'trunk' }),
            getSitesApsBridge: vi.fn().mockResolvedValue({ enabled: false }),
            listSitesApsPorts: vi.fn().mockResolvedValue([{ port: 1 }]),
            getAfcConfig: vi.fn().mockResolvedValue({ enabled: true }),
            getAntennaGainConfig: vi.fn().mockResolvedValue({ gain: 5 }),
            setApGeneralConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesApsIpSetting: vi.fn().mockResolvedValue({ accepted: true }),
            setApIpv6Config: vi.fn().mockResolvedValue({ accepted: true }),
            setApQosConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setRadiosConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setApServiceConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesApsLoadBalance: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesApsOfdma: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesApsTrunkSetting: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesApsBridge: vi.fn().mockResolvedValue({ accepted: true }),
            setApWlanGroup: vi.fn().mockResolvedValue({ accepted: true }),
            setSitesApsPortConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setApChannelConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setAfcConfig: vi.fn().mockResolvedValue({ accepted: true }),
            setAntennaGainConfig: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary with before state when getter exists', async () => {
        registerSetApConfigTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                configType: 'general-config',
                payload: { led: false },
                dryRun: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setApGeneralConfig).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-ap-config',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned general-config update for AP AA:BB:CC:DD:EE:FF.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                device: { mac: 'AA:BB:CC:DD:EE:FF', type: 'ap', name: 'Birou AP' },
                                configType: 'general-config',
                                before: { led: true },
                                beforeAvailable: true,
                                plannedConfig: { led: false },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('applies an AP config update through the matching setter', async () => {
        registerSetApConfigTool(mockServer, mockClient);

        await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                configType: 'service-config',
                payload: { sshEnable: false },
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setApServiceConfig).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', { sshEnable: false }, 'site-1', undefined);
    });

    it.each([
        ['ip-setting', 'getSitesApsIpSetting', 'setSitesApsIpSetting'],
        ['ipv6-setting', 'getApIpv6Config', 'setApIpv6Config'],
        ['qos', 'getApQosConfig', 'setApQosConfig'],
        ['radio-config', 'getRadiosConfig', 'setRadiosConfig'],
        ['load-balance', 'getSitesApsLoadBalance', 'setSitesApsLoadBalance'],
        ['ofdma', 'getSitesApsOfdma', 'setSitesApsOfdma'],
        ['trunk-setting', 'getSitesApsTrunkSetting', 'setSitesApsTrunkSetting'],
        ['bridge', 'getSitesApsBridge', 'setSitesApsBridge'],
        ['port-config', 'listSitesApsPorts', 'setSitesApsPortConfig'],
        ['afc-config', 'getAfcConfig', 'setAfcConfig'],
        ['antenna-gain', 'getAntennaGainConfig', 'setAntennaGainConfig'],
    ])('supports the %s config branch', async (configType, getterName, setterName) => {
        registerSetApConfigTool(mockServer, mockClient);

        await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                configType,
                payload: { enabled: true },
            },
            { sessionId: 's1' }
        );

        expect(mockClient[getterName as keyof OmadaClient] as ReturnType<typeof vi.fn>).toHaveBeenCalled();
        expect(mockClient[setterName as keyof OmadaClient] as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
            'AA:BB:CC:DD:EE:FF',
            { enabled: true },
            undefined,
            undefined
        );
    });

    it.each([
        ['service-config', 'setApServiceConfig', { sshEnable: false }],
        ['wlan-group', 'setApWlanGroup', { wlanId: 'wlan-1' }],
        ['channel-config', 'setApChannelConfig', { radioSettings: [{ radioId: 0, channel: 1 }] }],
    ])('returns explicit dry-run limitations for setter-only AP config branch %s', async (configType, setterName, payload) => {
        registerSetApConfigTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                configType,
                payload,
                dryRun: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient[setterName as keyof OmadaClient] as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-ap-config',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: `Planned ${configType} update for AP AA:BB:CC:DD:EE:FF.`,
                            result: {
                                accepted: true,
                                dryRun: true,
                                device: { mac: 'AA:BB:CC:DD:EE:FF', type: 'ap', name: 'Birou AP' },
                                configType,
                                before: null,
                                beforeAvailable: false,
                                warning: 'Current controller state cannot be previewed for this config family before apply.',
                                plannedConfig: payload,
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it.each([
        ['service-config', 'setApServiceConfig', { sshEnable: false }],
        ['wlan-group', 'setApWlanGroup', { wlanId: 'wlan-1' }],
        ['channel-config', 'setApChannelConfig', { radioSettings: [{ radioId: 0, channel: 1 }] }],
    ])('applies setter-only AP config branch %s after validation', async (configType, setterName, payload) => {
        registerSetApConfigTool(mockServer, mockClient);

        await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                configType,
                payload,
            },
            { sessionId: 's1' }
        );

        expect(mockClient[setterName as keyof OmadaClient] as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
            'AA:BB:CC:DD:EE:FF',
            payload,
            undefined,
            undefined
        );
    });

    it('rejects empty service-config payloads', async () => {
        registerSetApConfigTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    configType: 'service-config',
                    payload: {},
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('payload must include at least one field.');
    });

    it('rejects wlan-group payloads without WLAN identifiers', async () => {
        registerSetApConfigTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    configType: 'wlan-group',
                    payload: { profile: 'default' },
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('wlan-group payload must include wlanId or wlanIds.');
    });

    it('rejects empty channel-config payloads', async () => {
        registerSetApConfigTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    configType: 'channel-config',
                    payload: {},
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('payload must include at least one field.');
    });

    it('rejects channel-config updates when available channel data is missing', async () => {
        vi.mocked(mockClient.getSitesApsAvailableChannel).mockResolvedValue([] as never);
        registerSetApConfigTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    configType: 'channel-config',
                    payload: { radioSettings: [{ radioId: 0, channel: 1 }] },
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('AP AA:BB:CC:DD:EE:FF does not expose available channel data for channel-config validation.');
    });

    it('throws when the AP is not found', async () => {
        vi.mocked(mockClient.getDevice).mockResolvedValue(undefined);
        registerSetApConfigTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    configType: 'general-config',
                    payload: { led: false },
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('AP AA:BB:CC:DD:EE:FF was not found in the selected site.');
    });
});
