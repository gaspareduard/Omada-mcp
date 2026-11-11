import { describe, expect, it, vi } from 'vitest';

import { registerForceProvisionDeviceTool } from '../../src/tools/forceProvisionDevice.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('tools/forceProvisionDevice', () => {
    const devices = [{ mac: 'AA-BB-CC-DD-EE-01', name: 'Gateway', type: 'gateway' }];

    it('previews with a disruption warning, then provisions once', async () => {
        const client = { listDevices: vi.fn().mockResolvedValue(devices), forceProvisionDevice: vi.fn().mockResolvedValue({}) };
        const harness = toolHarness(registerForceProvisionDeviceTool, client);
        const preview = await harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-01' });
        expect(preview).toMatchObject({ status: 'planned', result: { target: devices[0], warnings: [expect.stringContaining('disconnect')] } });
        expect(client.forceProvisionDevice).not.toHaveBeenCalled();

        await expect(harness.invoke({ deviceMac: 'AA-BB-CC-DD-EE-01', dryRun: false })).resolves.toMatchObject({ status: 'submitted' });
        expect(client.forceProvisionDevice).toHaveBeenCalledWith('AA-BB-CC-DD-EE-01', undefined, undefined);
    });
});
