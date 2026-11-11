import { describe, expect, it, vi } from 'vitest';

import { registerLocateDeviceTool } from '../../src/tools/locateDevice.js';
import { toolHarness } from '../helpers/toolHarness.js';

const devices = [{ mac: 'AA-BB-CC-DD-EE-01', name: 'Office AP', type: 'ap', model: 'EAP', status: 1, secretish: 'x' }];

describe('tools/locateDevice', () => {
    it('previews the target device without sending', async () => {
        const client = { listDevices: vi.fn().mockResolvedValue(devices), locateDevice: vi.fn() };
        const result = await toolHarness(registerLocateDeviceTool, client).invoke({ deviceMac: 'aa:bb:cc:dd:ee:01' });
        expect(client.locateDevice).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            status: 'planned',
            result: { target: { mac: 'AA-BB-CC-DD-EE-01', name: 'Office AP', type: 'ap', model: 'EAP', status: 1, locateEnable: true } },
        });
    });

    it('starts and stops locating', async () => {
        const client = { listDevices: vi.fn().mockResolvedValue(devices), locateDevice: vi.fn().mockResolvedValue({}) };
        const harness = toolHarness(registerLocateDeviceTool, client);
        await expect(harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-01', dryRun: false, siteId: 's1' })).resolves.toMatchObject({ status: 'submitted' });
        await harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-01', enable: false, dryRun: false });
        expect(client.locateDevice).toHaveBeenNthCalledWith(1, 'AA-BB-CC-DD-EE-01', { locateEnable: true }, 's1', undefined);
        expect(client.locateDevice).toHaveBeenNthCalledWith(2, 'AA-BB-CC-DD-EE-01', { locateEnable: false }, undefined, undefined);
    });

    it('refuses unknown devices', async () => {
        const client = { listDevices: vi.fn().mockResolvedValue([]), locateDevice: vi.fn() };
        await expect(toolHarness(registerLocateDeviceTool, client).invoke({ deviceMac: 'AA-BB-CC-DD-EE-01', dryRun: false })).rejects.toThrow(
            'No device with MAC AA-BB-CC-DD-EE-01'
        );
        expect(client.locateDevice).not.toHaveBeenCalled();
    });
});
