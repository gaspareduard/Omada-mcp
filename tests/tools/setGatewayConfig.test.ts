import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { parseGatewayPayload, registerSetGatewayConfigTool } from '../../src/tools/setGatewayConfig.js';

const cases = [
    ['general-config', 'setSitesGatewaysGeneralConfig', { ledSetting: 0 }],
    ['config-general', 'setSitesGatewaysConfigGeneral', { ledSetting: 0, name: 'Gateway' }],
    ['config-services', 'setSitesGatewaysConfigServices', { snmp: { location: 'Office' } }],
    ['config-advanced', 'setSitesGatewaysConfigAdvanced', { lldpEnable: false, echoServer: 'example.com' }],
    ['config-radios', 'setSitesGatewaysConfigRadios', { radioSetting2g: { radioEnable: false } }],
    ['config-wlans', 'setSitesGatewaysConfigWlans', { wlanId: 'wlan-1', ssidOverrides: [] }],
    ['port-config', 'setSitesGatewaysPortConfig', { status: 0, linkSpeed: 0 }],
    ['multi-port-config', 'setSitesGatewaysMultiPortsConfig', { portsConfig: [{ port: 1, status: 0 }] }],
] as const;

describe('tools/setGatewayConfig', () => {
    let handler: (args: unknown, extra: object) => Promise<{ content: { text: string }[] }>;
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let server: McpServer;

    beforeEach(() => {
        client = {
            getDevice: vi.fn().mockResolvedValue({ type: 'gateway' }),
            getSitesGatewaysGeneralConfig: vi.fn().mockResolvedValue({ ledSetting: 1 }),
        };
        for (const [, setter] of cases) client[setter] = vi.fn().mockResolvedValue({ accepted: true });
        server = {
            registerTool: vi.fn((_name, _schema, callback) => {
                handler = callback;
            }),
        } as unknown as McpServer;
        registerSetGatewayConfigTool(server, client as unknown as OmadaClient);
    });

    function call(
        configType: string,
        payload: unknown,
        dryRun?: boolean,
        portName: string | undefined = 'wan1'
    ): Promise<{ content: { text: string }[] }> {
        return handler(
            { gatewayMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1', configType, portName, payload, ...(dryRun === undefined ? {} : { dryRun }) },
            {}
        );
    }

    it.each(cases)('defaults to dry-run for %s', async (configType, setter, payload) => {
        const result = JSON.parse((await call(configType, payload)).content[0].text);
        expect(result).toMatchObject({
            mode: 'dry-run',
            status: 'planned',
            result: { plannedConfig: payload, beforeAvailable: configType === 'general-config' },
        });
        expect(client[setter]).not.toHaveBeenCalled();
    });

    it.each(cases)('applies the documented %s payload exactly once', async (configType, setter, payload) => {
        if (configType === 'general-config') client.getSitesGatewaysGeneralConfig.mockResolvedValueOnce({ ledSetting: 1 }).mockResolvedValue(payload);
        const result = JSON.parse((await call(configType, payload, false)).content[0].text);
        const expected = ['AA:BB:CC:DD:EE:FF', ...(configType === 'port-config' ? ['wan1'] : []), payload, 'site-1', undefined];
        expect(client[setter]).toHaveBeenCalledExactlyOnceWith(...expected);
        expect(result.result.verification.status).toBe(configType === 'general-config' ? 'verified' : 'unverifiable');
    });

    it.each(cases)('rejects arbitrary fields in %s before reads', async (configType, setter, payload) => {
        await expect(call(configType, { ...payload, enabled: true })).rejects.toThrow();
        expect(client.getDevice).not.toHaveBeenCalled();
        expect(client[setter]).not.toHaveBeenCalled();
    });

    it.each([true, false])('requires portName before dry-run=%s', async (dryRun) => {
        await expect(handler({ gatewayMac: 'AA:BB:CC:DD:EE:FF', configType: 'port-config', payload: { status: 0 }, dryRun }, {})).rejects.toThrow(
            'portName is required'
        );
        expect(client.getDevice).not.toHaveBeenCalled();
        await expect(call('port-config', { status: 0 }, dryRun, ' ')).rejects.toThrow();
    });

    it('validates documented required fields and nested enum/range constraints', () => {
        expect(() => parseGatewayPayload('config-services', {})).toThrow('at least one field');
        expect(() => parseGatewayPayload('config-services', { snmp: {} })).toThrow('at least one field');
        expect(() => parseGatewayPayload('general-config', { name: 'missing led' })).toThrow();
        expect(() => parseGatewayPayload('general-config', { ledSetting: 3 })).toThrow();
        expect(() => parseGatewayPayload('config-services', { snmp: { sshEnable: true } })).toThrow();
        expect(() => parseGatewayPayload('config-advanced', { lldpEnable: 'false' })).toThrow();
        expect(() => parseGatewayPayload('config-advanced', { echoServer: 'not a host' })).toThrow();
        expect(() => parseGatewayPayload('config-radios', { radioSetting6g: { txPowerLevel: 99 } })).toThrow();
        expect(() => parseGatewayPayload('config-wlans', { ssidOverrides: [{}] })).toThrow();
        expect(() => parseGatewayPayload('port-config', { pvid: 4095 })).toThrow();
        expect(() => parseGatewayPayload('port-config', { dslSettings: { modulationType: 1 } })).toThrow();
        expect(() => parseGatewayPayload('multi-port-config', { portsConfig: [{ status: 0 }] })).toThrow();
        expect(() => parseGatewayPayload('multi-port-config', { portsConfig: [] })).toThrow();
    });

    it('avoids a no-op and reports a missing gateway', async () => {
        client.getSitesGatewaysGeneralConfig.mockResolvedValue({ ledSetting: 0 });
        const result = JSON.parse((await call('general-config', { ledSetting: 0 }, false)).content[0].text);
        expect(result.result).toMatchObject({ noOp: true, verification: { status: 'verified' } });
        expect(client.setSitesGatewaysGeneralConfig).not.toHaveBeenCalled();
        client.getDevice.mockResolvedValue(undefined);
        await expect(call('general-config', { ledSetting: 0 })).rejects.toThrow('not found');
    });
});
