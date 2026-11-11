import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateMacFilterTool } from '../../src/tools/updateMacFilter.js';

const payload = { name: 'mcp-test', filterMode: 1, type: 0, macAddresses: [{ macAddress: '02-00-00-00-00-01', name: 'test' }] };
const current = { name: 'mcp-test', filterMode: 0, type: 0, macAddresses: [{ macAddress: '02-00-00-00-00-01', name: 'test' }], id: 'id-1' };

describe('tools/updateMacFilter', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listMacFilters: vi.fn(async (...args: unknown[]) => (args[0] === 'deny' ? [] : state)),
            updateMacFilter: vi.fn(() => {
                state = [{ name: 'mcp-test', filterMode: 1, type: 0, macAddresses: [{ macAddress: '02-00-00-00-00-01', name: 'test' }], id: 'id-1' }];
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerUpdateMacFilterTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ filterId: 'id-1', payload }, {});
        expect(client.updateMacFilter).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ filterId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateMacFilter).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ filterId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No MAC filtering entry with id "missing"');
        expect(client.updateMacFilter).not.toHaveBeenCalled();
    });
});
