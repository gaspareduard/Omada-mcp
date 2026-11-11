import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeletePortForwardingRuleTool } from '../../src/tools/deletePortForwardingRule.js';

const current = {
    name: 'mcp-test',
    status: false,
    from: 0,
    externalPort: '65001',
    forwardIp: '192.0.2.50',
    forwardPort: '65001',
    protocol: 1,
    dMZ: false,
    interfaceWanPortId: ['wan-1'],
    id: 'id-1',
};

describe('tools/deletePortForwardingRule', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listPortForwardingRules: vi.fn(async () => state),
            deletePortForwarding: vi.fn(() => {
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
        registerDeletePortForwardingRuleTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.portForwardingId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ portForwardingId: 'id-1' }, {});
        expect(client.deletePortForwarding).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ portForwardingId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deletePortForwarding).toHaveBeenCalledWith('id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });
});
