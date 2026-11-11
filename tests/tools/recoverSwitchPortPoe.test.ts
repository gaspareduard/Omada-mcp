import { describe, expect, it, vi } from 'vitest';

import { registerRecoverSwitchPortPoeTool } from '../../src/tools/recoverSwitchPortPoe.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('tools/recoverSwitchPortPoe', () => {
    const detail = { portList: [{ port: 1, name: 'Camera' }, { port: 2 }] };

    it('validates explicit unique ports', () => {
        const schema = toolHarness(registerRecoverSwitchPortPoeTool, {}).schema();
        expect(() => schema.parse({ switchMac: 'AA-BB-CC-DD-EE-01', ports: [1, 1] })).toThrow();
        expect(() => schema.parse({ switchMac: 'AA-BB-CC-DD-EE-01', ports: [] })).toThrow();
    });

    it('refuses ports that do not exist, including on a switch without a port list', async () => {
        const client = { getSwitchDetail: vi.fn().mockResolvedValueOnce(detail).mockResolvedValueOnce({}), recoverSwitchPortPoe: vi.fn() };
        const harness = toolHarness(registerRecoverSwitchPortPoeTool, client);
        await expect(harness.invoke({ switchMac: 'AA-BB-CC-DD-EE-01', ports: [1, 9], dryRun: false })).rejects.toThrow('Ports 9 do not exist');
        await expect(harness.invoke({ switchMac: 'AA-BB-CC-DD-EE-01', ports: [1], dryRun: false })).rejects.toThrow('Ports 1 do not exist');
        expect(client.recoverSwitchPortPoe).not.toHaveBeenCalled();
    });

    it('previews named ports, then power-cycles them once', async () => {
        const client = { getSwitchDetail: vi.fn().mockResolvedValue(detail), recoverSwitchPortPoe: vi.fn().mockResolvedValue({}) };
        const harness = toolHarness(registerRecoverSwitchPortPoeTool, client);
        await expect(harness.invoke({ switchMac: 'AA-BB-CC-DD-EE-01', ports: [1, 2] })).resolves.toMatchObject({
            status: 'planned',
            result: { target: { ports: [{ port: 1, name: 'Camera' }, { port: 2 }] } },
        });
        await harness.invoke({ switchMac: 'AA-BB-CC-DD-EE-01', ports: [1, 2], dryRun: false });
        expect(client.recoverSwitchPortPoe).toHaveBeenCalledWith('AA-BB-CC-DD-EE-01', { ports: [1, 2] }, undefined, undefined);
    });
});
