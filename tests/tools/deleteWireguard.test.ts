import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteWireguardTool } from '../../src/tools/deleteWireguard.js';

const current = {
    name: 'mcp-test',
    status: true,
    listenPort: 51820,
    localIp: '10.66.0.1',
    mtu: 1420,
    privateKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    id: 'id-1',
};

describe('tools/deleteWireguard', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listWireguardTunnels: vi.fn(async () => state),
            deleteWireguard: vi.fn(() => {
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
        registerDeleteWireguardTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.wireguardId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ wireguardId: 'id-1' }, {});
        expect(client.deleteWireguard).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ wireguardId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deleteWireguard).toHaveBeenCalledWith('id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });
});
