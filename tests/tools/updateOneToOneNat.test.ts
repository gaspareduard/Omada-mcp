import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateOneToOneNatTool } from '../../src/tools/updateOneToOneNat.js';

const payload = { name: 'mcp-test', status: false, interfaceIds: ['wan-1'], internalIp: '192.0.2.250', externalIp: '198.51.100.10', dmz: false };
const current = {
    name: 'mcp-test',
    status: true,
    interfaceIds: ['wan-1'],
    internalIp: '192.0.2.250',
    externalIp: '198.51.100.10',
    dmz: false,
    id: 'id-1',
};

describe('tools/updateOneToOneNat', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listOneToOneNats: vi.fn(async () => state),
            updateOneToOneNat: vi.fn(() => {
                state = [
                    {
                        name: 'mcp-test',
                        status: false,
                        interfaceIds: ['wan-1'],
                        internalIp: '192.0.2.250',
                        externalIp: '198.51.100.10',
                        dmz: false,
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
        registerUpdateOneToOneNatTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ otonatId: 'id-1', payload }, {});
        expect(client.updateOneToOneNat).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ otonatId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateOneToOneNat).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ otonatId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No one-to-one NAT rule with id "missing"');
        expect(client.updateOneToOneNat).not.toHaveBeenCalled();
    });
});
