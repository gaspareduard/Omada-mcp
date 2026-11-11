import { describe, expect, it, vi } from 'vitest';

import { registerAdoptDeviceTool } from '../../src/tools/adoptDevice.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('tools/adoptDevice', () => {
    const pending = [{ mac: 'AA-BB-CC-DD-EE-02', name: 'New AP', type: 'ap', ip: '192.0.2.5' }];

    it('only adopts devices that are pending', async () => {
        const client = { listPendingDevices: vi.fn().mockResolvedValue(pending), adoptDevice: vi.fn() };
        await expect(toolHarness(registerAdoptDeviceTool, client).invoke({ deviceMac: 'AA-BB-CC-DD-EE-03', dryRun: false })).rejects.toThrow(
            'No pending device with MAC'
        );
        expect(client.adoptDevice).not.toHaveBeenCalled();
    });

    it('previews, then adopts with default or supplied credentials', async () => {
        const client = { listPendingDevices: vi.fn().mockResolvedValue(pending), adoptDevice: vi.fn().mockResolvedValue({}) };
        const harness = toolHarness(registerAdoptDeviceTool, client);
        await expect(harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-02' })).resolves.toMatchObject({
            status: 'planned',
            result: { target: pending[0] },
        });
        await harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-02', dryRun: false });
        await harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-02', dryRun: false, credentials: { username: 'admin', password: 'pw' } });
        expect(client.adoptDevice).toHaveBeenNthCalledWith(1, 'AA-BB-CC-DD-EE-02', {}, undefined, undefined);
        expect(client.adoptDevice).toHaveBeenNthCalledWith(2, 'AA-BB-CC-DD-EE-02', { username: 'admin', password: 'pw' }, undefined, undefined);
    });
});
