import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetAttackDefenseSettingTool } from '../../src/tools/setAttackDefenseSetting.js';

const payload = {
    icmpConnEnable: false,
    icmpSrcEnable: false,
    largePingEnable: false,
    pingDeathEnable: false,
    pingWanEnable: false,
    specifiedOptionEnable: false,
    tcpConnEnable: false,
    tcpFinNoAckEnable: false,
    tcpScanEnable: false,
    tcpSrcEnable: false,
    tcpSynFinEnable: false,
    udpConnEnable: false,
    udpSrcEnable: false,
    winNukeAttackEnable: false,
};
const before = { tcpScanEnable: true };

describe('tools/setAttackDefenseSetting', () => {
    let handler: (args: Record<string, unknown>, extra: { sessionId?: string }) => Promise<{ structuredContent?: Record<string, unknown> }>;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;
    let state: Record<string, unknown>;

    beforeEach(() => {
        state = before;
        client = {
            getAttackDefenseSetting: vi.fn(async () => state),
            setAttackDefenseSetting: vi.fn(() => {
                state = {
                    tcpScanEnable: false,
                    icmpConnEnable: false,
                    icmpSrcEnable: false,
                    largePingEnable: false,
                    pingDeathEnable: false,
                    pingWanEnable: false,
                    specifiedOptionEnable: false,
                    tcpConnEnable: false,
                    tcpFinNoAckEnable: false,
                    tcpSrcEnable: false,
                    tcpSynFinEnable: false,
                    udpConnEnable: false,
                    udpSrcEnable: false,
                    winNukeAttackEnable: false,
                };
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerSetAttackDefenseSettingTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
        expect(definition.inputSchema.payload.parse(payload)).toEqual(payload);
    });

    it('previews the difference from current settings', async () => {
        const result = await handler({ payload }, {});
        expect(client.setAttackDefenseSetting).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ payload, siteId: 'site-1', dryRun: false }, { sessionId: 's' });
        expect(client.setAttackDefenseSetting).toHaveBeenCalledWith(payload, 'site-1', undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });
});
