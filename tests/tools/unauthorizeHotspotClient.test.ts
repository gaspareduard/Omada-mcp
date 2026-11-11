import { describe, expect, it, vi } from 'vitest';

import { registerUnauthorizeHotspotClientTool } from '../../src/tools/unauthorizeHotspotClient.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('tools/unauthorizeHotspotClient', () => {
    it('refuses unknown clients', async () => {
        const client = { getClientDetail: vi.fn().mockResolvedValue(undefined), unauthorizeHotspotClient: vi.fn() };
        await expect(
            toolHarness(registerUnauthorizeHotspotClientTool, client).invoke({ clientMac: 'AA-BB-CC-DD-EE-01', dryRun: false })
        ).rejects.toThrow('No client with MAC');
        expect(client.unauthorizeHotspotClient).not.toHaveBeenCalled();
    });

    it('previews the client, then submits once', async () => {
        const client = {
            getClientDetail: vi.fn().mockResolvedValue({ mac: 'AA-BB-CC-DD-EE-01', name: 'Guest', guest: true, authStatus: 0, rssi: -50 }),
            unauthorizeHotspotClient: vi.fn().mockResolvedValue({}),
        };
        const harness = toolHarness(registerUnauthorizeHotspotClientTool, client);
        await expect(harness.invoke({ clientMac: 'AA-BB-CC-DD-EE-01' })).resolves.toMatchObject({
            status: 'planned',
            result: { target: { mac: 'AA-BB-CC-DD-EE-01', name: 'Guest', guest: true, authStatus: 0 } },
        });
        await expect(harness.invoke({ clientMac: 'AA-BB-CC-DD-EE-01', dryRun: false })).resolves.toMatchObject({ status: 'submitted' });
        expect(client.unauthorizeHotspotClient).toHaveBeenCalledWith('AA-BB-CC-DD-EE-01', undefined, undefined);
    });
});
