import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteLanNetworkTool } from '../../src/tools/deleteLanNetwork.js';

const current = { name: 'mcp-test', purpose: 0, vlan: 3999, igmpSnoopEnable: false, id: 'id-1' };

describe('tools/deleteLanNetwork', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            getLanNetworkList: vi.fn(async () => state),
            deleteLanNetwork: vi.fn(() => {
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
        registerDeleteLanNetworkTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.networkId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ networkId: 'id-1' }, {});
        expect(client.deleteLanNetwork).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ networkId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deleteLanNetwork).toHaveBeenCalledWith('id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('refuses protected records', async () => {
        state = [{ ...current, primary: true }];
        await expect(handler({ networkId: 'id-1', dryRun: false }, {})).rejects.toThrow('The primary LAN network cannot be deleted.');
        expect(client.deleteLanNetwork).not.toHaveBeenCalled();
    });
});
