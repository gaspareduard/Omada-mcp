import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteSsidTool } from '../../src/tools/deleteSsid.js';

const current = {
    name: 'mcp-test',
    deviceType: 1,
    band: 1,
    guestNetEnable: false,
    security: 0,
    broadcast: false,
    vlanEnable: false,
    mloEnable: false,
    pmfMode: 3,
    enable11r: false,
    hidePwd: false,
    ssidId: 'id-1',
};

describe('tools/deleteSsid', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [current];
        client = {
            getSsidList: vi.fn(async () => state),
            deleteSsid: vi.fn(() => {
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
        registerDeleteSsidTool(server, client as unknown as OmadaClient);
    });

    it('requires an identifier', () => {
        expect(() => definition.inputSchema.ssidId.parse('  ')).toThrow();
    });

    it('previews the record that would be deleted', async () => {
        const result = await handler({ wlanId: 'wlanId-1', ssidId: 'id-1' }, {});
        expect(client.deleteSsid).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before: current } });
    });

    it('deletes once and verifies absence', async () => {
        const result = await handler({ wlanId: 'wlanId-1', ssidId: 'id-1', siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.deleteSsid).toHaveBeenCalledWith('wlanId-1', 'id-1', 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });
});
