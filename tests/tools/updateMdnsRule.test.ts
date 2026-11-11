import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateMdnsRuleTool } from '../../src/tools/updateMdnsRule.js';

const payload = {
    name: 'mcp-test',
    status: false,
    profileIds: ['buildIn-1'],
    type: 1,
    osg: { serviceNetworks: ['net-1'], clientNetworks: ['net-2'] },
};
const current = {
    name: 'mcp-test',
    status: true,
    profileIds: ['buildIn-1'],
    type: 1,
    osg: { serviceNetworks: ['net-1'], clientNetworks: ['net-2'] },
    id: 'id-1',
};

describe('tools/updateMdnsRule', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listMdnsRules: vi.fn(async () => state),
            updateMdnsRule: vi.fn(() => {
                state = [
                    {
                        name: 'mcp-test',
                        status: false,
                        profileIds: ['buildIn-1'],
                        type: 1,
                        osg: { serviceNetworks: ['net-1'], clientNetworks: ['net-2'] },
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
        registerUpdateMdnsRuleTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ mdnsId: 'id-1', payload }, {});
        expect(client.updateMdnsRule).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ mdnsId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateMdnsRule).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ mdnsId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No mDNS rule with id "missing"');
        expect(client.updateMdnsRule).not.toHaveBeenCalled();
    });
});
