import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { parseApPayload, registerSetApConfigTool } from '../../src/tools/setApConfig.js';

const cases = [
    ['general-config', 'getApGeneralConfig', 'setApGeneralConfig', { ledSetting: 0 }],
    ['ip-setting', 'getSitesApsIpSetting', 'setSitesApsIpSetting', { mode: 'dhcp' }],
    ['ipv6-setting', 'getApIpv6Config', 'setApIpv6Config', { ipv6Enable: false }],
    ['qos', 'getApQosConfig', 'setApQosConfig', { deliveryEnable2g: false }],
    ['radio-config', 'getRadiosConfig', 'setRadiosConfig', { radioSetting2g: { radioEnable: false } }],
    ['load-balance', 'getSitesApsLoadBalance', 'setSitesApsLoadBalance', { enable: false, maxClients2g: 50 }],
    ['ofdma', 'getSitesApsOfdma', 'setSitesApsOfdma', { ofdmaEnable2g: false }],
    ['trunk-setting', 'getSitesApsTrunkSetting', 'setSitesApsTrunkSetting', { enable: false }],
    ['bridge', 'getSitesApsBridge', 'setSitesApsBridge', { bridgeSsidName: 'bridge', bridgeSsidPassword: 'example-password' }],
    ['port-config', 'listSitesApsPorts', 'setSitesApsPortConfig', { lanPort: '1', status: false }],
    ['afc-config', 'getAfcConfig', 'setAfcConfig', { enable: false }],
    ['antenna-gain', 'getAntennaGainConfig', 'setAntennaGainConfig', { anteGainList: [{ radioId: 0, anteGain: 5 }] }],
    ['service-config', null, 'setApServiceConfig', { lldpEnable: 0 }],
    ['wlan-group', null, 'setApWlanGroup', { wlanGroupId: 'wlan-1' }],
    ['channel-config', null, 'setApChannelConfig', { radioId: 0, radioEnable: true, channel: 1, channelWidth: 20 }],
] as const;

const split5gCases = [
    {
        configType: 'qos',
        getter: 'getApQosConfig',
        setter: 'setApQosConfig',
        firstField: 'deliveryEnable5g1',
        requested: { deliveryEnable5g1: false, deliveryEnable5g2: true },
        observed: { support5g2: true, deliveryEnable5g: false, deliveryEnable5g2: true },
        ignored: { support5g2: true, deliveryEnable5g: true, deliveryEnable5g2: true },
    },
    {
        configType: 'load-balance',
        getter: 'getSitesApsLoadBalance',
        setter: 'setSitesApsLoadBalance',
        firstField: 'maxClients5g1',
        requested: { maxClients5g1: 48, maxClients5g2: 96 },
        observed: { enable: true, maxClients2g: 32, maxClients5g: 48, maxClients5g2: 96 },
        ignored: { enable: true, maxClients2g: 32, maxClients5g: 64, maxClients5g2: 96 },
    },
] as const;

describe('tools/setApConfig', () => {
    let handler: (args: unknown, extra: object) => Promise<{ content: { text: string }[] }>;
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let server: McpServer;

    beforeEach(() => {
        client = {
            getDevice: vi.fn().mockResolvedValue({ type: 'ap' }),
            getSitesApsAvailableChannel: vi
                .fn()
                .mockResolvedValue({ radioId: 0, apChannelDetailList: [{ channel: 1, index: 1, freq: 2412, availableChannelWidthList: [20, 40] }] }),
        };
        for (const [, getter, setter] of cases) {
            if (getter) client[getter] = vi.fn().mockResolvedValue({});
            client[setter] = vi.fn().mockResolvedValue({ accepted: true });
        }
        server = {
            registerTool: vi.fn((_name, _schema, callback) => {
                handler = callback;
            }),
        } as unknown as McpServer;
        registerSetApConfigTool(server, client as unknown as OmadaClient);
    });

    function call(configType: string, payload: unknown, dryRun?: boolean): Promise<{ content: { text: string }[] }> {
        return handler({ apMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1', configType, payload, ...(dryRun === undefined ? {} : { dryRun }) }, {});
    }

    it.each(cases)('validates and defaults to dry-run for %s', async (configType, getter, setter, payload) => {
        const result = JSON.parse((await call(configType, payload)).content[0].text);
        expect(result).toMatchObject({ mode: 'dry-run', status: 'planned', result: { plannedConfig: payload, beforeAvailable: getter !== null } });
        expect(client[setter]).not.toHaveBeenCalled();
        if (getter) expect(client[getter]).toHaveBeenCalledTimes(1);
    });

    it.each(cases)('applies and verifies the documented %s family', async (configType, getter, setter, payload) => {
        if (getter) client[getter].mockResolvedValueOnce({}).mockResolvedValue(payload);
        const result = JSON.parse((await call(configType, payload, false)).content[0].text);
        expect(client[setter]).toHaveBeenCalledExactlyOnceWith('AA:BB:CC:DD:EE:FF', payload, 'site-1', undefined);
        expect(result.result.verification.status).toBe(getter && configType !== 'port-config' ? 'verified' : 'unverifiable');
    });

    it.each(cases)('rejects unknown fields for %s before reading or writing', async (configType, _getter, setter, payload) => {
        await expect(call(configType, { ...payload, inventedSetting: true })).rejects.toThrow();
        expect(client.getDevice).not.toHaveBeenCalled();
        expect(client[setter]).not.toHaveBeenCalled();
    });

    it('uses strict nested types, required fields, ranges, and nonempty payloads', () => {
        expect(() => parseApPayload('service-config', {})).toThrow('at least one field');
        expect(() => parseApPayload('service-config', { snmp: {} })).toThrow('at least one field');
        expect(() => parseApPayload('service-config', { l3AccessSetting: { madeUp: true } })).toThrow();
        expect(() => parseApPayload('ip-setting', { mode: 'auto' })).toThrow();
        expect(() => parseApPayload('ip-setting', { mode: 'static', staticIpSetting: { configIp: '999.1.2.3' } })).toThrow();
        expect(() => parseApPayload('ipv6-setting', { ipv6Enable: true, staticIpv6Setting: { ipv6Addr: 'not-ipv6' } })).toThrow();
        expect(() => parseApPayload('general-config', { ledSetting: 4 })).toThrow();
        expect(() => parseApPayload('qos', { deliveryEnable2g: 'false' })).toThrow();
        expect(() => parseApPayload('radio-config', { radioSetting2g: { channelWidth: '20', injected: 1 } })).toThrow();
        expect(() => parseApPayload('load-balance', { maxClients2g: 513 })).toThrow();
        expect(() => parseApPayload('bridge', { bridgeSsidName: 'bridge' })).toThrow();
        expect(() => parseApPayload('wlan-group', { wlanId: 'old-wrong-name' })).toThrow();
        expect(() => parseApPayload('channel-config', { radioEnable: true })).toThrow();
        expect(() => parseApPayload('antenna-gain', { anteGainList: [{ radioId: 4, anteGain: 31 }] })).toThrow();
        expect(() => parseApPayload('port-config', { status: false })).toThrow();
    });

    it('does not write when current fields already match', async () => {
        client.getApGeneralConfig.mockResolvedValue({ ledSetting: 0, extra: true });
        const result = JSON.parse((await call('general-config', { ledSetting: 0 }, false)).content[0].text);
        expect(result.result).toMatchObject({ noOp: true, verification: { status: 'verified' } });
        expect(client.setApGeneralConfig).not.toHaveBeenCalled();
    });

    it.each(split5gCases)('recognizes an actual $configType GET as a split-band no-op', async ({
        configType,
        getter,
        setter,
        requested,
        observed,
    }) => {
        client.getApQosConfig.mockResolvedValue({ support5g2: true });
        const snapshot = Object.freeze({ ...observed });
        client[getter].mockResolvedValue(snapshot);

        const result = JSON.parse((await call(configType, requested, false)).content[0].text);

        expect(result.result).toMatchObject({ noOp: true, before: snapshot, verification: { status: 'verified', attempts: 0, differences: [] } });
        expect(client[setter]).not.toHaveBeenCalled();
        expect(client[getter]).toHaveBeenCalledTimes(1);
        expect(client.getApQosConfig).toHaveBeenCalledExactlyOnceWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
        expect(result.result.before).not.toHaveProperty(configType === 'qos' ? 'deliveryEnable5g1' : 'maxClients5g1');
    });

    it.each(split5gCases)('verifies $configType after applying against actual GET field names', async ({
        configType,
        getter,
        setter,
        requested,
        observed,
        ignored,
    }) => {
        client.getApQosConfig.mockResolvedValue({ support5g2: true });
        client[getter].mockResolvedValueOnce(ignored).mockResolvedValue(observed);

        const result = JSON.parse((await call(configType, requested, false)).content[0].text);

        expect(client[setter]).toHaveBeenCalledExactlyOnceWith('AA:BB:CC:DD:EE:FF', requested, 'site-1', undefined);
        expect(result.result).toMatchObject({ noOp: false, before: ignored, verification: { status: 'verified', attempts: 1, differences: [] } });
    });

    it.each(split5gCases)('reports ignored $configType first-radio changes as mismatch, not missing', async ({
        configType,
        getter,
        setter,
        requested,
        ignored,
        firstField,
    }) => {
        client.getApQosConfig.mockResolvedValue({ support5g2: true });
        client[getter].mockResolvedValue(ignored);

        const result = JSON.parse((await call(configType, requested, false)).content[0].text);

        expect(result.result.verification).toEqual({ status: 'mismatch', attempts: 3, differences: [{ path: firstField, reason: 'different' }] });
        expect(client[setter]).toHaveBeenCalledTimes(1);
        expect(client[getter]).toHaveBeenCalledTimes(4);
    });

    it.each([false, undefined, 'true'])('does not infer a split QoS radio from support5g2=%s', async (support5g2) => {
        client.getApQosConfig.mockResolvedValue({ support5g2, deliveryEnable5g: false, deliveryEnable5g2: true });
        const result = JSON.parse((await call('qos', { deliveryEnable5g1: false, deliveryEnable5g2: true }, false)).content[0].text);
        expect(result.result).toMatchObject({
            noOp: false,
            verification: { status: 'unverifiable', differences: [{ path: 'deliveryEnable5g1', reason: 'missing' }] },
        });
        expect(client.setApQosConfig).toHaveBeenCalledTimes(1);
    });

    it('uses only documented QoS capability evidence for the load-balance mapping', async () => {
        client.getApQosConfig.mockResolvedValue({ support5g2: false });
        client.getSitesApsLoadBalance.mockResolvedValue({ support5g2: true, maxClients5g: 48, maxClients5g2: 96 });
        const result = JSON.parse((await call('load-balance', { maxClients5g1: 48, maxClients5g2: 96 }, false)).content[0].text);
        expect(result.result).toMatchObject({
            noOp: false,
            verification: { status: 'unverifiable', differences: [{ path: 'maxClients5g1', reason: 'missing' }] },
        });
    });

    it.each([
        ['qos', 'getApQosConfig', 'setApQosConfig', { deliveryEnable5g: false }],
        ['load-balance', 'getSitesApsLoadBalance', 'setSitesApsLoadBalance', { maxClients5g: 48 }],
    ] as const)('retains the unsplit %s field when frequency splitting is unsupported', async (configType, getter, setter, requested) => {
        client.getApQosConfig.mockResolvedValue({ support5g2: false });
        client[getter].mockResolvedValue({ support5g2: false, ...requested });
        const result = JSON.parse((await call(configType, requested, false)).content[0].text);
        expect(result.result).toMatchObject({ noOp: true, verification: { status: 'verified' } });
        expect(client[setter]).not.toHaveBeenCalled();
    });

    it('does not equate a whole-band QoS request with only the first split radio', async () => {
        client.getApQosConfig.mockResolvedValue({ support5g2: true, deliveryEnable5g: false, deliveryEnable5g2: true });
        const result = JSON.parse((await call('qos', { deliveryEnable5g: false }, false)).content[0].text);
        expect(result.result.verification).toMatchObject({ status: 'unverifiable', differences: [{ path: 'deliveryEnable5g', reason: 'missing' }] });
    });

    it.each([null, [], { support5g2: true }])('does not invent absent split QoS values from %j', async (snapshot) => {
        client.getApQosConfig.mockResolvedValue(snapshot);
        const result = JSON.parse((await call('qos', { deliveryEnable5g1: false }, false)).content[0].text);
        expect(result.result.noOp).toBe(false);
        expect(result.result.verification.status).not.toBe('verified');
    });

    it('reports an ignored field as mismatch and does not replay', async () => {
        client.getApGeneralConfig.mockResolvedValue({ ledSetting: 1 });
        const result = JSON.parse((await call('general-config', { ledSetting: 0 }, false)).content[0].text);
        expect(result.result.verification).toMatchObject({ status: 'mismatch', attempts: 3 });
        expect(client.setApGeneralConfig).toHaveBeenCalledTimes(1);
    });

    it.each([
        { radioId: 0, radioEnable: true, channel: 99 },
        { radioId: 0, radioEnable: true, channel: 1, channelWidth: 160 },
        { radioId: 1, radioEnable: true },
    ])('rejects unavailable channel capability %j even in dry run', async (payload) => {
        await expect(call('channel-config', payload)).rejects.toThrow();
        expect(client.setApChannelConfig).not.toHaveBeenCalled();
    });

    it('accepts automatic channels only with an advertised width', async () => {
        await call('channel-config', { radioId: 0, radioEnable: true, channel: 0, channelWidth: 40 });
        await expect(call('channel-config', { radioId: 0, radioEnable: true, channelWidth: 160 })).rejects.toThrow('not advertised');
    });

    it('fails safely with missing channel data or device', async () => {
        client.getSitesApsAvailableChannel.mockResolvedValue([]);
        await expect(call('channel-config', { radioId: 0, radioEnable: true })).rejects.toThrow('does not expose');
        client.getDevice.mockResolvedValue(undefined);
        await expect(call('general-config', { ledSetting: 0 })).rejects.toThrow('not found');
    });
});
