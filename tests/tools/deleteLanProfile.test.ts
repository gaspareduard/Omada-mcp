import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteLanProfileTool } from '../../src/tools/deleteLanProfile.js';

const current = {
    name: 'mcp-test',
    poe: 2,
    nativeNetworkId: 'net-1',
    tagNetworkIds: [],
    dot1x: 2,
    portIsolationEnable: false,
    lldpMedEnable: true,
    bandWidthCtrlType: 0,
    spanningTreeEnable: false,
    loopbackDetectEnable: false,
    id: 'id-1',
};

describe('tools/deleteLanProfile', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            getLanProfileList: vi.fn(async () => state),
            deleteLanProfile: vi.fn(() => {
                state = [];
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerDeleteLanProfileTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.profileId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ profileId: 'id-1' }, {});
        expect(client.deleteLanProfile).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ profileId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deleteLanProfile).toHaveBeenCalledWith('id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('refuses protected records', async () => {
        state = [{ ...current, flag: 0 }];
        await expect(handler({ profileId: 'id-1', dryRun: false }, {})).rejects.toThrow(
            'System LAN profiles (All, Default, Disable) cannot be deleted.'
        );
        expect(client.deleteLanProfile).not.toHaveBeenCalled();
    });
});
