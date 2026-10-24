import { describe, expect, it, vi } from 'vitest';
import { registerDiagnoseCameraConnectivityTool } from '../../src/tools/diagnoseCameraConnectivity.js';
import { toolHarness } from '../helpers/toolHarness.js';

describe('diagnoseCameraConnectivity', () => {
    function setup() {
        const client = {
            resolveSiteId: vi.fn(async () => 'resolved'),
            getClient: vi.fn(async (): Promise<unknown> => ({ mac: 'AA-BB-CC-DD-EE-FF' })),
            getClientDetail: vi.fn(async () => ({ vlan: 4 })),
            listClientsPastConnections: vi.fn(async () => []),
        };
        return { client, tool: toolHarness(registerDiagnoseCameraConnectivityTool, client) };
    }
    it('resolves a name to a MAC and keeps history bounds explicit', async () => {
        const { client, tool } = setup();
        expect(await tool.invoke({ identifier: 'camera' })).toMatchObject({
            siteId: 'resolved',
            resolvedMac: 'AA-BB-CC-DD-EE-FF',
            complete: true,
            historyComplete: false,
        });
        expect(client.getClientDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'resolved', undefined);
        expect(tool.schema().safeParse({ identifier: '' }).success).toBe(false);
    });
    it('retains direct MAC evidence for offline clients and degrades partial failures', async () => {
        const { client, tool } = setup();
        client.getClient.mockRejectedValue(new Error('offline'));
        client.listClientsPastConnections.mockRejectedValue(new Error('history unavailable'));
        expect(await tool.invoke({ identifier: 'AA:BB:CC:DD:EE:FF' })).toMatchObject({
            resolvedMac: 'AA:BB:CC:DD:EE:FF',
            complete: false,
            missing: ['current', 'sessions'],
        });
    });
    it('does not invent a MAC for an unresolved name', async () => {
        const { client, tool } = setup();
        client.getClient.mockResolvedValue(undefined);
        expect(await tool.invoke({ identifier: 'unknown' })).toMatchObject({ resolvedMac: null, complete: false, missing: ['detail'] });
        expect(client.getClientDetail).not.toHaveBeenCalled();
    });
    it('handles a record without a MAC', async () => {
        const { client, tool } = setup();
        client.getClient.mockResolvedValue({ name: 'unknown' });
        expect(await tool.invoke({ identifier: 'unknown' })).toMatchObject({ resolvedMac: null, complete: false });
    });
});
