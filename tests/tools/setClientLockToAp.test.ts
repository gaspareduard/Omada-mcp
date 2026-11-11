import { describe, expect, it, vi } from 'vitest';

import { registerSetClientLockToApTool } from '../../src/tools/setClientLockToAp.js';
import { toolHarness } from '../helpers/toolHarness.js';

const devices = [
    { mac: 'AA-BB-CC-DD-EE-01', type: 'ap' },
    { mac: 'AA-BB-CC-DD-EE-02', type: 'ap' },
    { mac: 'AA-BB-CC-DD-EE-09', type: 'gateway' },
];

function setup(detail: Record<string, unknown> | undefined) {
    let lock = { enable: false } as Record<string, unknown>;
    const client = {
        listDevices: vi.fn().mockResolvedValue(devices),
        getClientDetail: vi.fn(async () => detail && { ...detail, clientLockToApSetting: lock }),
        setClientLockToAp: vi.fn((_mac: string, body: Record<string, unknown>) => {
            lock = body;
            return Promise.resolve();
        }),
    };
    return { client, harness: toolHarness(registerSetClientLockToApTool, client) };
}

describe('tools/setClientLockToAp', () => {
    const wireless = { mac: 'CC-CC-CC-CC-CC-01', wireless: true, apMac: 'aa:bb:cc:dd:ee:01' };

    it('requires APs when enabling and refuses non-AP devices', async () => {
        const { client, harness } = setup(wireless);
        await expect(harness.invoke({ clientMac: 'CC-CC-CC-CC-CC-01', enable: true })).rejects.toThrow('aps is required');
        await expect(harness.invoke({ clientMac: 'CC-CC-CC-CC-CC-01', enable: true, aps: ['AA-BB-CC-DD-EE-09'] })).rejects.toThrow('is not an AP');
        expect(client.setClientLockToAp).not.toHaveBeenCalled();
    });

    it('refuses unknown and wired clients', async () => {
        await expect(setup(undefined).harness.invoke({ clientMac: 'CC-CC-CC-CC-CC-01', enable: false })).rejects.toThrow('No client with MAC');
        await expect(setup({ wireless: false }).harness.invoke({ clientMac: 'CC-CC-CC-CC-CC-01', enable: false })).rejects.toThrow(
            'Only wireless clients'
        );
    });

    it('warns when the current AP is excluded', async () => {
        const { harness } = setup(wireless);
        const preview = await harness.invoke({ clientMac: 'CC-CC-CC-CC-CC-01', enable: true, aps: ['aa:bb:cc:dd:ee:02'] });
        expect(preview).toMatchObject({ status: 'planned', result: { planned: { enable: true, aps: ['AA-BB-CC-DD-EE-02'] } } });
        expect((preview.result as { warnings: string[] }).warnings[0]).toContain('currently associated with AA-BB-CC-DD-EE-01');
    });

    it('locks to the current AP and unlocks, verifying each by readback', async () => {
        const { client, harness } = setup(wireless);
        await expect(
            harness.invoke({ clientMac: 'CC-CC-CC-CC-CC-01', enable: true, aps: ['AA-BB-CC-DD-EE-01'], dryRun: false })
        ).resolves.toMatchObject({
            status: 'verified',
        });
        await expect(harness.invoke({ clientMac: 'CC-CC-CC-CC-CC-01', enable: false, dryRun: false })).resolves.toMatchObject({ status: 'verified' });
        expect(client.setClientLockToAp).toHaveBeenNthCalledWith(
            1,
            'CC-CC-CC-CC-CC-01',
            { enable: true, aps: ['AA-BB-CC-DD-EE-01'] },
            undefined,
            undefined
        );
        expect(client.setClientLockToAp).toHaveBeenNthCalledWith(2, 'CC-CC-CC-CC-CC-01', { enable: false }, undefined, undefined);
    });
});
