import { describe, expect, it, vi } from 'vitest';

import { registerAuthorizeHotspotClientTool } from '../../src/tools/authorizeHotspotClient.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('tools/authorizeHotspotClient', () => {
    it('refuses unknown clients', async () => {
        const client = { getClientDetail: vi.fn().mockResolvedValue(undefined), authorizeHotspotClient: vi.fn() };
        await expect(
            toolHarness(registerAuthorizeHotspotClientTool, client).invoke({ clientMac: 'AA-BB-CC-DD-EE-01', dryRun: false })
        ).rejects.toThrow('No client with MAC');
        expect(client.authorizeHotspotClient).not.toHaveBeenCalled();
    });

    it('previews the client, then submits once', async () => {
        const client = {
            getClientDetail: vi.fn().mockResolvedValue({ mac: 'AA-BB-CC-DD-EE-01', name: 'Guest', guest: true, authStatus: 0, rssi: -50 }),
            authorizeHotspotClient: vi.fn().mockResolvedValue({}),
        };
        const harness = toolHarness(registerAuthorizeHotspotClientTool, client);
        await expect(harness.invoke({ clientMac: 'AA-BB-CC-DD-EE-01' })).resolves.toMatchObject({
            status: 'planned',
            result: { target: { mac: 'AA-BB-CC-DD-EE-01', name: 'Guest', guest: true, authStatus: 0 } },
        });
        await expect(harness.invoke({ clientMac: 'AA-BB-CC-DD-EE-01', dryRun: false })).resolves.toMatchObject({ status: 'submitted' });
        expect(client.authorizeHotspotClient).toHaveBeenCalledWith('AA-BB-CC-DD-EE-01', undefined, undefined);
    });
});
