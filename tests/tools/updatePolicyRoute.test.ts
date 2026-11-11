import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdatePolicyRouteTool } from '../../src/tools/updatePolicyRoute.js';

const payload = {
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
};
const current = {
    name: 'mcp-test',
    status: true,
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

describe('tools/updatePolicyRoute', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listPolicyRoutes: vi.fn(async () => state),
            updatePolicyRoute: vi.fn(() => {
                state = [
                    {
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
                    },
                ];
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerUpdatePolicyRouteTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ policyRoutingId: 'id-1', payload }, {});
        expect(client.updatePolicyRoute).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ policyRoutingId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updatePolicyRoute).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ policyRoutingId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No policy route with id "missing"');
        expect(client.updatePolicyRoute).not.toHaveBeenCalled();
    });
});
