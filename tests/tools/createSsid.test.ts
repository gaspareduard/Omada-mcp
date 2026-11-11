import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerCreateSsidTool } from '../../src/tools/createSsid.js';

const payload = {
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
};

describe('tools/createSsid', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [];
        client = {
            getSsidList: vi.fn(async () => state),
            getSsidDetail: vi.fn((_wlanId: string, ssidId: string) => Promise.resolve(state.find((record) => record.ssidId === ssidId))),
            createSsid: vi.fn(() => {
                state = [
                    {
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

                        ssidId: 'new-1',
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
        registerCreateSsidTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
        expect(definition.inputSchema.payload.parse(payload)).toEqual(payload);
    });

    it('previews by default without writing', async () => {
        const result = await handler({ wlanId: 'wlanId-1', payload }, { sessionId: 's' });
        expect(client.createSsid).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { dryRun: true, planned: payload } });
    });

    it('creates once and verifies the readback', async () => {
        const result = await handler({ wlanId: 'wlanId-1', payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.createSsid).toHaveBeenCalledTimes(1);
        expect(client.createSsid).toHaveBeenCalledWith('wlanId-1', payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified', result: { createdId: 'new-1' } });
    });

    it('surfaces controller rejections', async () => {
        client.createSsid.mockRejectedValueOnce(new OmadaApiError(-1, 'rejected'));
        await expect(handler({ wlanId: 'wlanId-1', payload, dryRun: false }, {})).rejects.toThrow('(errorCode -1): rejected');
    });
});
