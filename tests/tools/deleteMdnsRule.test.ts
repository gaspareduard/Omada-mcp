import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteMdnsRuleTool } from '../../src/tools/deleteMdnsRule.js';

const current = {
    name: 'mcp-test',
    status: false,
    profileIds: ['buildIn-1'],
    type: 1,
    osg: { serviceNetworks: ['net-1'], clientNetworks: ['net-2'] },
    id: 'id-1',
};

describe('tools/deleteMdnsRule', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listMdnsRules: vi.fn(async () => state),
            deleteMdnsRule: vi.fn(() => {
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
        registerDeleteMdnsRuleTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.mdnsId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ mdnsId: 'id-1' }, {});
        expect(client.deleteMdnsRule).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ mdnsId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deleteMdnsRule).toHaveBeenCalledWith('id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });
});
