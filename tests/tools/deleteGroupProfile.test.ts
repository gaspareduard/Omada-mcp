import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteGroupProfileTool } from '../../src/tools/deleteGroupProfile.js';

const current = { name: 'mcp-test', type: 0, ipList: [{ ip: '192.0.2.0', mask: 24 }], groupId: 'id-1' };

describe('tools/deleteGroupProfile', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listGroupProfiles: vi.fn(async () => state),
            deleteGroupProfile: vi.fn(() => {
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
        registerDeleteGroupProfileTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.groupId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ groupType: 'groupType-1', groupId: 'id-1' }, {});
        expect(client.deleteGroupProfile).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ groupType: 'groupType-1', groupId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deleteGroupProfile).toHaveBeenCalledWith('groupType-1', 'id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('refuses protected records', async () => {
        state = [{ ...current, buildIn: true }];
        await expect(handler({ groupType: 'groupType-1', groupId: 'id-1', dryRun: false }, {})).rejects.toThrow(
            'Built-in group profiles cannot be deleted.'
        );
        expect(client.deleteGroupProfile).not.toHaveBeenCalled();
    });
});
