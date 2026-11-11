import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteOneToOneNatTool } from '../../src/tools/deleteOneToOneNat.js';

const current = {
    name: 'mcp-test',
    status: false,
    interfaceIds: ['wan-1'],
    internalIp: '192.0.2.250',
    externalIp: '198.51.100.10',
    dmz: false,
    id: 'id-1',
};

describe('tools/deleteOneToOneNat', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listOneToOneNatRules: vi.fn(async () => state),
            deleteOneToOneNat: vi.fn(() => {
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
        registerDeleteOneToOneNatTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.otonatId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ otonatId: 'id-1' }, {});
        expect(client.deleteOneToOneNat).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ otonatId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deleteOneToOneNat).toHaveBeenCalledWith('id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });
});
