import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeletePolicyRouteTool } from '../../src/tools/deletePolicyRoute.js';

const current = {
    name: 'mcp-test',
    status: false,
    protocols: [256],
    interfaceType: 0,
    interfaceId: 'wan-1',
    backupInterface: false,
    sourceType: 0,
    sourceIds: ['net-1'],
    destinationType: 1,
    destinationIds: ['grp-1'],
    id: 'id-1',
};

describe('tools/deletePolicyRoute', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listPolicyRoutes: vi.fn(async () => state),
            deletePolicyRoute: vi.fn(() => {
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
        registerDeletePolicyRouteTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.policyRoutingId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ policyRoutingId: 'id-1' }, {});
        expect(client.deletePolicyRoute).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ policyRoutingId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deletePolicyRoute).toHaveBeenCalledWith('id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });
});
