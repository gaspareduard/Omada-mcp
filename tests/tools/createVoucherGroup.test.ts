import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerCreateVoucherGroupTool } from '../../src/tools/createVoucherGroup.js';

const payload = {
    name: 'mcp-test',
    amount: 1,
    codeLength: 6,
    codeForm: [0],
    limitType: 0,
    limitNum: 1,
    durationType: 0,
    duration: 60,
    timingType: 0,
    rateLimit: { mode: 0 },
    trafficLimitEnable: false,
    applyToAllPortals: true,
};

describe('tools/createVoucherGroup', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>[];

    beforeEach(() => {
        state = [];
        client = {
            listVoucherGroups: vi.fn(async () => state),
            createVoucherGroup: vi.fn(() => {
                state = [
                    {
                        name: 'mcp-test',
                        amount: 1,
                        codeLength: 6,
                        codeForm: [0],
                        limitType: 0,
                        limitNum: 1,
                        durationType: 0,
                        duration: 60,
                        timingType: 0,
                        rateLimit: { mode: 0 },
                        trafficLimitEnable: false,
                        applyToAllPortals: true,
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
        registerCreateVoucherGroupTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
        expect(definition.inputSchema.payload.parse(payload)).toEqual(payload);
    });

    it('previews by default without writing', async () => {
        const result = await handler({ payload }, { sessionId: 's' });
        expect(client.createVoucherGroup).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { dryRun: true, planned: payload } });
    });

    it('creates once and verifies the readback', async () => {
        const result = await handler({ payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.createVoucherGroup).toHaveBeenCalledTimes(1);
        expect(client.createVoucherGroup).toHaveBeenCalledWith(payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified', result: { createdId: 'new-1' } });
    });

    it('surfaces controller rejections', async () => {
        client.createVoucherGroup.mockRejectedValueOnce(new OmadaApiError(-1, 'rejected'));
        await expect(handler({ payload, dryRun: false }, {})).rejects.toThrow('(errorCode -1): rejected');
    });
});
