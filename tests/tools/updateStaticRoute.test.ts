import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateStaticRouteTool } from '../../src/tools/updateStaticRoute.js';

const payload = { name: 'mcp-test', status: false, destinations: ['198.51.100.0/24'], routeType: 0, nextHopIp: '192.0.2.1', metric: 1 };
const current = {
    name: 'mcp-test',
    status: false,
    destinations: ['198.51.100.0/24'],
    routeType: 0,
    nextHopIp: '192.0.2.1',
    metric: 5,
    id: 'id-1',
};

describe('tools/updateStaticRoute', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            listStaticRoutes: vi.fn(async () => state),
            updateStaticRoute: vi.fn(() => {
                state = [
                    {
                        name: 'mcp-test',
                        status: false,
                        destinations: ['198.51.100.0/24'],
                        routeType: 0,
                        nextHopIp: '192.0.2.1',
                        metric: 1,
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
        registerUpdateStaticRouteTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ staticRoutingId: 'id-1', payload }, {});
        expect(client.updateStaticRoute).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ staticRoutingId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateStaticRoute).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ staticRoutingId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No static route with id "missing"');
        expect(client.updateStaticRoute).not.toHaveBeenCalled();
    });
});
