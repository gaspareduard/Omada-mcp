import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateLanProfileTool } from '../../src/tools/updateLanProfile.js';

const payload = {
    name: 'mcp-test',
    poe: 2,
    nativeNetworkId: 'net-1',
    tagNetworkIds: [],
    dot1x: 2,
    portIsolationEnable: false,
    lldpMedEnable: true,
    bandWidthCtrlType: 0,
    spanningTreeEnable: false,
    loopbackDetectEnable: false,
};
const current = {
    name: 'mcp-test',
    poe: 2,
    nativeNetworkId: 'net-1',
    tagNetworkIds: [],
    dot1x: 2,
    portIsolationEnable: true,
    lldpMedEnable: true,
    bandWidthCtrlType: 0,
    spanningTreeEnable: false,
    loopbackDetectEnable: false,
    id: 'id-1',
};

describe('tools/updateLanProfile', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            getLanProfileList: vi.fn(async () => state),
            updateLanProfile: vi.fn(() => {
                state = [
                    {
                        name: 'mcp-test',
                        poe: 2,
                        nativeNetworkId: 'net-1',
                        tagNetworkIds: [],
                        dot1x: 2,
                        portIsolationEnable: false,
                        lldpMedEnable: true,
                        bandWidthCtrlType: 0,
                        spanningTreeEnable: false,
                        loopbackDetectEnable: false,
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
        registerUpdateLanProfileTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
    });

    it('previews the change against the current record', async () => {
        const result = await handler({ profileId: 'id-1', payload }, {});
        expect(client.updateLanProfile).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ profileId: 'id-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.updateLanProfile).toHaveBeenCalledWith('id-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('rejects unknown ids before writing', async () => {
        await expect(handler({ profileId: 'missing', payload, dryRun: false }, {})).rejects.toThrow('No LAN profile with id "missing"');
        expect(client.updateLanProfile).not.toHaveBeenCalled();
    });
});
