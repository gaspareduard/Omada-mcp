import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateDdnsEntryTool } from '../../src/tools/updateDdnsEntry.js';

const payload = {
    service: 1,
    status: false,
    interfacePortId: 'wan-1',
    username: 'user@example.com',
    password: 'not-a-real-pass',
    domainName: 'omada-mcp-test.example.com',
    interval: { updateInterval: 6 },
};
const current = {
    service: 1,
    status: true,
    interfacePortId: 'wan-1',
    username: 'user@example.com',
    password: 'not-a-real-pass',
    domainName: 'omada-mcp-test.example.com',
    id: 'id-1',
};

describe('tools/updateDdnsEntry', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listDdnsEntries: vi.fn(async () => state),
            updateDdnsEntry: vi.fn(() => {
                state = [
                    {
                        service: 1,
                        status: false,
                        interfacePortId: 'wan-1',
                        username: 'user@example.com',
                        domainName: 'omada-mcp-test.example.com',
                        updateInterval: 6,
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
        registerUpdateDdnsEntryTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ ddnsId: 'id-1', payload }, {});
        expect(client.updateDdnsEntry).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ ddnsId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateDdnsEntry).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ ddnsId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No dynamic DNS entry with id "missing"');
        expect(client.updateDdnsEntry).not.toHaveBeenCalled();
    });
});
