import { describe, expect, it, vi } from 'vitest';

import { registerSetClientNameTool } from '../../src/tools/setClientName.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('tools/setClientName', () => {
    it('validates the documented name pattern', () => {
        const schema = toolHarness(registerSetClientNameTool, {}).schema();
        expect(() => schema.parse({ clientMac: 'AA-BB-CC-DD-EE-01', name: ' leading space' })).toThrow();
        expect(schema.parse({ clientMac: 'AA-BB-CC-DD-EE-01', name: '' })).toMatchObject({ name: '' });
    });

    it('previews, renames once and verifies the readback', async () => {
        let name = 'Old';
        const client = {
            getClientDetail: vi.fn(async () => ({ mac: 'AA-BB-CC-DD-EE-01', name, hostName: 'host', rssi: -40 })),
            setClientName: vi.fn((_mac: string, body: { name: string }) => {
                name = body.name;
                return Promise.resolve();
            }),
        };
        const harness = toolHarness(registerSetClientNameTool, client);
        await expect(harness.invoke({ clientMac: 'AA-BB-CC-DD-EE-01', name: 'New' })).resolves.toMatchObject({
            status: 'planned',
            result: { before: { mac: 'AA-BB-CC-DD-EE-01', name: 'Old', hostName: 'host' } },
        });
        await expect(harness.invoke({ clientMac: 'AA-BB-CC-DD-EE-01', name: 'New', dryRun: false })).resolves.toMatchObject({ status: 'verified' });
        expect(client.setClientName).toHaveBeenCalledWith('AA-BB-CC-DD-EE-01', { name: 'New' }, undefined, undefined);
    });

    it('fails when the client does not exist', async () => {
        const client = { getClientDetail: vi.fn().mockResolvedValue(undefined), setClientName: vi.fn() };
        await expect(toolHarness(registerSetClientNameTool, client).invoke({ clientMac: 'AA-BB-CC-DD-EE-01', name: 'x' })).rejects.toThrow(
            'unexpected client name settings'
        );
    });
});
