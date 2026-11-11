import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateGroupProfileTool } from '../../src/tools/updateGroupProfile.js';

const payload = { name: 'mcp-test', type: 0, ipList: [{ ip: '192.0.2.0', mask: 24 }] };
const current = { name: 'mcp-old', type: 0, ipList: [{ ip: '192.0.2.0', mask: 24 }], groupId: 'id-1' };

describe('tools/updateGroupProfile', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listGroupProfiles: vi.fn(async () => state),
            updateGroupProfile: vi.fn(() => {
                state = [{ name: 'mcp-test', type: 0, ipList: [{ ip: '192.0.2.0', mask: 24 }], groupId: 'id-1' }];
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerUpdateGroupProfileTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ groupType: 'groupType-1', groupId: 'id-1', payload }, {});
        expect(client.updateGroupProfile).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ groupType: 'groupType-1', groupId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateGroupProfile).toHaveBeenCalledWith('groupType-1', 'id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ groupType: 'groupType-1', groupId: 'missing', payload, dryRun: false }, {})).rejects.toThrow(
            'No group profile with id "missing"'
        );
        expect(client.updateGroupProfile).not.toHaveBeenCalled();
    });
});
