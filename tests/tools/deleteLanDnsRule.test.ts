import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteLanDnsRuleTool } from '../../src/tools/deleteLanDnsRule.js';

const current = {
    enable: false,
    name: 'mcp-test',
    domain: 'omada-mcp-test.example',
    type: 0,
    ipAddresses: ['192.0.2.10'],
    lanNetworkIds: ['net-1'],
    id: 'id-1',
};

describe('tools/deleteLanDnsRule', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listLanDnsRules: vi.fn(async () => state),
            deleteLanDnsRule: vi.fn(() => {
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
        registerDeleteLanDnsRuleTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.dnsId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ dnsId: 'id-1' }, {});
        expect(client.deleteLanDnsRule).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ dnsId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deleteLanDnsRule).toHaveBeenCalledWith('id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });
});
