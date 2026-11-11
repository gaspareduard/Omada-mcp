import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateLanDnsRuleTool } from '../../src/tools/updateLanDnsRule.js';

const payload = { enable: false, name: 'mcp-test', domain: 'omada-mcp-test.example', type: 0, ipAddresses: ['192.0.2.10'], lanNetworkIds: ['net-1'] };
const current = {
    enable: true,
    name: 'mcp-test',
    domain: 'omada-mcp-test.example',
    type: 0,
    ipAddresses: ['192.0.2.10'],
    lanNetworkIds: ['net-1'],
    id: 'id-1',
};

describe('tools/updateLanDnsRule', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listLanDnsRules: vi.fn(async () => state),
            updateLanDnsRule: vi.fn(() => {
                state = [
                    {
                        enable: false,
                        name: 'mcp-test',
                        domain: 'omada-mcp-test.example',
                        type: 0,
                        ipAddresses: ['192.0.2.10'],
                        lanNetworkIds: ['net-1'],
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
        registerUpdateLanDnsRuleTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ dnsId: 'id-1', payload }, {});
        expect(client.updateLanDnsRule).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ dnsId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateLanDnsRule).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ dnsId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No LAN DNS rule with id "missing"');
        expect(client.updateLanDnsRule).not.toHaveBeenCalled();
    });
});
