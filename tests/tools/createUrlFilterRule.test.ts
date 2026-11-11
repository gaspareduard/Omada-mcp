import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerCreateUrlFilterRuleTool } from '../../src/tools/createUrlFilterRule.js';

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

describe('tools/createUrlFilterRule', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [];
        client = {
            listUrlFilterRules: vi.fn(async (...args: unknown[]) => (args[0] === 'eap' ? [] : state)),
            createUrlFilterRule: vi.fn(() => {
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
                        id: 'new-1',
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
        registerCreateUrlFilterRuleTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
        expect(definition.inputSchema.payload.parse(payload)).toEqual(payload);
    });

    it('previews by default without writing', async () => {
        const result = await handler({ payload }, { sessionId: 's' });
        expect(client.createUrlFilterRule).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { dryRun: true, planned: payload } });
    });

    it('creates once and verifies the readback', async () => {
        const result = await handler({ payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.createUrlFilterRule).toHaveBeenCalledTimes(1);
        expect(client.createUrlFilterRule).toHaveBeenCalledWith(payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified', result: { createdId: 'new-1' } });
    });

    it('surfaces controller rejections', async () => {
        client.createUrlFilterRule.mockRejectedValueOnce(new OmadaApiError(-1, 'rejected'));
        await expect(handler({ payload, dryRun: false }, {})).rejects.toThrow('(errorCode -1): rejected');
    });
});
