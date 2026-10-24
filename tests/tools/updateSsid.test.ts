import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerUpdateSsidTool } from '../../src/tools/updateSsid.js';

describe('tools/updateSsid', () => {
    let handler: (args: unknown, extra: object) => Promise<{ content: { text: string }[] }>;
    let state: Record<string, unknown>;
    let client: { getSsidDetail: ReturnType<typeof vi.fn>; updateSsidBasicConfig: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        state = {
            ssidId: 'ssid-1',
            name: 'Before',
            band: 3,
            guestNetEnable: false,
            security: 0,
            broadcast: true,
            vlanEnable: false,
            mloEnable: false,
            pmfMode: 3,
            enable11r: false,
            clientRateLimit: { enable: true },
            deviceType: 1,
        };
        client = {
            getSsidDetail: vi.fn(() => Promise.resolve(state)),
            updateSsidBasicConfig: vi.fn((_wlan, _ssid, payload) => {
                state = { ...state, ...payload };
                return Promise.resolve(undefined);
            }),
        };
        const server = {
            registerTool: vi.fn((_name, _schema, callback) => {
                handler = callback;
            }),
        } as unknown as McpServer;
        registerUpdateSsidTool(server, client);
        expect(server.registerTool).toHaveBeenCalledWith(
            'updateSsid',
            expect.objectContaining({ annotations: { destructiveHint: true } }),
            expect.any(Function)
        );
    });

    async function call(changes: Record<string, unknown>, dryRun?: boolean): Promise<Record<string, unknown>> {
        return JSON.parse(
            (
                await handler(
                    {
                        wlanId: 'wlan-1',
                        ssidId: 'ssid-1',
                        siteId: 'site-1',
                        customHeaders: { 'X-Test': 'header' },
                        changes,
                        ...(dryRun === undefined ? {} : { dryRun }),
                    },
                    {}
                )
            ).content[0].text
        ).result;
    }

    it('defaults to dry run and exposes only the requested public changes', async () => {
        expect(await call({ name: 'After' })).toMatchObject({ dryRun: true, changes: { name: 'After' }, wlanId: 'wlan-1', ssidId: 'ssid-1' });
        expect(client.updateSsidBasicConfig).not.toHaveBeenCalled();
        expect(client.getSsidDetail).toHaveBeenCalledExactlyOnceWith('wlan-1', 'ssid-1', 'site-1', { 'X-Test': 'header' });
    });

    it('preserves writable security/VLAN settings but excludes GET-only fields', async () => {
        state = {
            ...state,
            security: 3,
            vlanEnable: true,
            vlanId: 123,
            hidePwd: false,
            pskSetting: { securityKey: 'test-key-short', versionPsk: 2, encryptionPsk: 3, gikRekeyPskEnable: false, readOnly: 9 },
        };
        const result = await call({ name: 'After', broadcast: false, prohibitWifiShare: true }, false);
        expect(client.updateSsidBasicConfig).toHaveBeenCalledExactlyOnceWith(
            'wlan-1',
            'ssid-1',
            expect.objectContaining({
                name: 'After',
                broadcast: false,
                vlanId: 123,
                security: 3,
                pskSetting: { securityKey: 'test-key-short', versionPsk: 2, encryptionPsk: 3, gikRekeyPskEnable: false },
            }),
            'site-1',
            { 'X-Test': 'header' }
        );
        const payload = client.updateSsidBasicConfig.mock.calls[0][2];
        expect(payload).not.toHaveProperty('ssidId');
        expect(payload).not.toHaveProperty('clientRateLimit');
        expect(payload).not.toHaveProperty('deviceType');
        expect(result).toMatchObject({ verification: { status: 'verified', attempts: 1 }, writeAcknowledged: true });
        expect(JSON.stringify(result)).not.toContain('test-key-short');
        expect(JSON.stringify(result)).not.toContain('securityKey');
    });

    it('does not write if the requested fields already match', async () => {
        expect(await call({ broadcast: true }, false)).toMatchObject({ noOp: true, verification: { status: 'verified', attempts: 0 } });
        expect(client.updateSsidBasicConfig).not.toHaveBeenCalled();
        expect(client.getSsidDetail).toHaveBeenCalledTimes(1);
    });

    it('previews and applies an enterprise SSID rename while preserving inactive NAS ID fields', async () => {
        const entSetting = { radiusProfileId: 'radius', versionEnt: 2, encryptionEnt: 3, gikRekeyEntEnable: false, nasIdMode: 0, nasId: '' };
        state = { ...state, security: 2, entSetting };

        expect(await call({ name: 'After' })).toMatchObject({ dryRun: true, changes: { name: 'After' } });
        expect(client.updateSsidBasicConfig).not.toHaveBeenCalled();
        expect(await call({ name: 'After' }, false)).toMatchObject({ noOp: false, verification: { status: 'verified' } });
        expect(client.updateSsidBasicConfig).toHaveBeenCalledExactlyOnceWith(
            'wlan-1',
            'ssid-1',
            expect.objectContaining({ name: 'After', security: 2, entSetting }),
            'site-1',
            { 'X-Test': 'header' }
        );
    });

    it('rejects a concurrently changed snapshot', async () => {
        client.getSsidDetail.mockResolvedValueOnce(state).mockResolvedValue({ ...state, guestNetEnable: true });
        await expect(call({ name: 'After' }, false)).rejects.toThrow('changed during planning');
        expect(client.updateSsidBasicConfig).not.toHaveBeenCalled();
    });

    it.each([
        {},
        { enable: false },
        { broadcast: 'false' },
        { name: '😀'.repeat(9) },
        { name: '' },
        { security: 0 },
    ])('rejects unsupported or invalid changes %j', async (changes) => {
        await expect(call(changes)).rejects.toThrow();
        expect(client.getSsidDetail).not.toHaveBeenCalled();
    });

    it('fails closed if the GET omits required configuration or hides the password', async () => {
        state = { name: 'incomplete' };
        await expect(call({ name: 'After' })).rejects.toThrow();
        state = {
            name: 'Before',
            band: 3,
            guestNetEnable: false,
            security: 3,
            broadcast: true,
            vlanEnable: false,
            mloEnable: false,
            pmfMode: 3,
            enable11r: false,
            pskSetting: { securityKey: '********', versionPsk: 2, encryptionPsk: 3, gikRekeyPskEnable: false },
        };
        await expect(call({ name: 'After' })).rejects.toThrow('missing or masked');
        expect(client.updateSsidBasicConfig).not.toHaveBeenCalled();
    });

    it('reports ignored writes as mismatch', async () => {
        client.updateSsidBasicConfig.mockResolvedValue(undefined);
        expect(await call({ guestNetEnable: true }, false)).toMatchObject({ verification: { status: 'mismatch', attempts: 3 } });
        expect(client.updateSsidBasicConfig).toHaveBeenCalledTimes(1);
    });

    it('reconciles a lost write acknowledgement using readback without a second write', async () => {
        client.updateSsidBasicConfig.mockImplementation((_wlan, _ssid, payload) => {
            state = payload;
            return Promise.reject(new Error('timeout'));
        });
        expect(await call({ name: 'After' }, false)).toMatchObject({ writeAcknowledged: false, verification: { status: 'verified' } });
        expect(client.updateSsidBasicConfig).toHaveBeenCalledTimes(1);
    });

    it('detects newly exposed writable settings in the second snapshot', async () => {
        client.getSsidDetail.mockResolvedValueOnce(state).mockResolvedValue({ ...state, prohibitWifiShare: true });
        await expect(call({ name: 'After' }, false)).rejects.toThrow('changed during planning');
        expect(client.updateSsidBasicConfig).not.toHaveBeenCalled();
    });
});
