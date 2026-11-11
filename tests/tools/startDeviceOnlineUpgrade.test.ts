import { describe, expect, it, vi } from 'vitest';

import { registerStartDeviceOnlineUpgradeTool } from '../../src/tools/startDeviceOnlineUpgrade.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('tools/startDeviceOnlineUpgrade', () => {
    const devices = [{ mac: 'AA-BB-CC-DD-EE-01', name: 'AP', type: 'ap' }];

    it.each([
        { curFwVer: '1.0' },
        { curFwVer: '1.0', lastFwVer: '1.0' },
        { curFwVer: '1.0', lastFwVer: '' },
        null,
    ])('refuses when no newer firmware is offered (%j)', async (firmware) => {
        const client = {
            listDevices: vi.fn().mockResolvedValue(devices),
            getFirmwareInfo: vi.fn().mockResolvedValue(firmware),
            startDeviceOnlineUpgrade: vi.fn(),
        };
        await expect(toolHarness(registerStartDeviceOnlineUpgradeTool, client).invoke({ deviceMac: 'AA-BB-CC-DD-EE-01' })).rejects.toThrow(
            'no newer online firmware'
        );
        expect(client.startDeviceOnlineUpgrade).not.toHaveBeenCalled();
    });

    it('previews the version change, then starts the upgrade', async () => {
        const client = {
            listDevices: vi.fn().mockResolvedValue(devices),
            getFirmwareInfo: vi.fn().mockResolvedValue({ curFwVer: '1.0', lastFwVer: '1.1' }),
            startDeviceOnlineUpgrade: vi.fn().mockResolvedValue({}),
        };
        const harness = toolHarness(registerStartDeviceOnlineUpgradeTool, client);
        await expect(harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-01' })).resolves.toMatchObject({
            status: 'planned',
            result: { target: { currentFirmware: '1.0', targetFirmware: '1.1' } },
        });
        await expect(harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-01', dryRun: false })).resolves.toMatchObject({ status: 'submitted' });
        expect(client.startDeviceOnlineUpgrade).toHaveBeenCalledWith('AA-BB-CC-DD-EE-01', undefined, undefined);
    });
});
