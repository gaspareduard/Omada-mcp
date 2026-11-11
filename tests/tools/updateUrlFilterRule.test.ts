import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateUrlFilterRuleTool } from '../../src/tools/updateUrlFilterRule.js';

const payload = {
    type: 'gateway',
    name: 'mcp-test',
    status: false,
    policy: 0,
    sourceType: 0,
    sourceIds: ['net-1'],
    mode: 0,
    urls: ['omada-mcp-test.example'],
    filterMode: 0,
};
const current = {
    type: 'gateway',
    name: 'mcp-test',
    status: true,
    policy: 0,
    sourceType: 0,
    sourceIds: ['net-1'],
    mode: 0,
    urls: ['omada-mcp-test.example'],
    filterMode: 0,
    id: 'id-1',
};

describe('tools/updateUrlFilterRule', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listUrlFilterRules: vi.fn(async (...args: unknown[]) => (args[0] === 'eap' ? [] : state)),
            updateUrlFilterRule: vi.fn(() => {
                state = [
                    {
                        type: 'gateway',
                        name: 'mcp-test',
                        status: false,
                        policy: 0,
                        sourceType: 0,
                        sourceIds: ['net-1'],
                        mode: 0,
                        urls: ['omada-mcp-test.example'],
                        filterMode: 0,
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
        registerUpdateUrlFilterRuleTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ ruleId: 'id-1', payload }, {});
        expect(client.updateUrlFilterRule).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ ruleId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateUrlFilterRule).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ ruleId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No URL filtering rule with id "missing"');
        expect(client.updateUrlFilterRule).not.toHaveBeenCalled();
    });
});
