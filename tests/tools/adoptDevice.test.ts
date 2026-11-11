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

    it('does not accept credentials as tool arguments', () => {
        const schema = toolHarness(registerAdoptDeviceTool, {}).schema();
        expect(() => schema.strict().parse({ deviceMac: 'AA-BB-CC-DD-EE-02', credentials: { username: 'admin', password: 'pw' } })).toThrow();
    });

    it('previews, then adopts with the default login', async () => {
        const client = { listPendingDevices: vi.fn().mockResolvedValue(pending), adoptDevice: vi.fn().mockResolvedValue({}) };
        const harness = toolHarness(registerAdoptDeviceTool, client);
        await expect(harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-02' })).resolves.toMatchObject({
            status: 'planned',
            result: { target: pending[0] },
        });
        await harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-02', dryRun: false });
        expect(client.adoptDevice).toHaveBeenCalledWith('AA-BB-CC-DD-EE-02', {}, undefined, undefined);
    });
});
