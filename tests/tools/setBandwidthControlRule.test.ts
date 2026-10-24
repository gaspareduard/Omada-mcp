import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetBandwidthControlRuleTool } from '../../src/tools/setBandwidthControlRule.js';

describe('tools/setBandwidthControlRule', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    const payload = {
        name: 'Guests cap',
        status: true,
        sourceType: 0,
        sourceIds: ['net-guests'],
        wanPortIds: ['wan1'],
        upstreamBandwidth: 10000,
        upstreamBandwidthUnit: 2,
        downstreamBandwidth: 20000,
        downstreamBandwidthUnit: 2,
        mode: 1,
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
            }),
        } as unknown as McpServer;

        mockClient = {
            getGridBandwidthCtrlRule: vi.fn().mockResolvedValue({ data: [{ id: 'bw-1', name: 'Old rule' }] }),
            getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'net-guests' }]),
            getInternetBasicPortInfo: vi.fn().mockResolvedValue({ portUuids: ['wan1'] }),
            getInternetInfo: vi.fn().mockResolvedValue({ portUuids: ['wan1'] }),
            createBandwidthCtrlRule: vi.fn().mockResolvedValue({ id: 'bw-2' }),
            updateBandwidthCtrlRule: vi.fn().mockResolvedValue({ id: 'bw-1' }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview', async () => {
        registerSetBandwidthControlRuleTool(mockServer, mockClient);

        const result = await toolHandler({ payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.createBandwidthCtrlRule).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'create-bandwidth-control-rule',
                target: 'default-site',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned bandwidth control rule mutation.',
                result: {
                    accepted: true,
                    dryRun: true,
                    before: undefined,
                    plannedRule: payload,
                },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('throws when updating a missing bandwidth rule', async () => {
        registerSetBandwidthControlRuleTool(mockServer, mockClient);

        await expect(toolHandler({ dryRun: false, ruleId: 'missing', payload }, { sessionId: 's1' })).rejects.toThrow(
            'No bandwidth control rule exists for missing.'
        );
    });

    it('rejects unknown LAN/WAN references before mutating', async () => {
        registerSetBandwidthControlRuleTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    dryRun: false,
                    payload: {
                        ...payload,
                        sourceIds: ['missing-net'],
                        wanPortIds: ['missing-wan'],
                    },
                    siteId: 'site-1',
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('Unknown LAN network ids in sourceIds: missing-net.');

        expect(mockClient.createBandwidthCtrlRule).not.toHaveBeenCalled();
    });

    it('rejects unknown WAN references after LAN validation passes', async () => {
        registerSetBandwidthControlRuleTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    dryRun: false,
                    payload: {
                        ...payload,
                        wanPortIds: ['missing-wan'],
                    },
                    siteId: 'site-1',
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('Unknown WAN port ids: missing-wan.');

        expect(mockClient.createBandwidthCtrlRule).not.toHaveBeenCalled();
    });

    it('routes create and update calls to the client', async () => {
        registerSetBandwidthControlRuleTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, payload, siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.createBandwidthCtrlRule).toHaveBeenCalledWith(payload, 'site-1', undefined);

        await toolHandler({ dryRun: false, ruleId: 'bw-1', payload, siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.updateBandwidthCtrlRule).toHaveBeenCalledWith('bw-1', payload, 'site-1', undefined);
    });

    it('hydrates the created rule from the grid when the create response does not include an id', async () => {
        vi.mocked(mockClient.createBandwidthCtrlRule).mockResolvedValueOnce({});
        vi.mocked(mockClient.getGridBandwidthCtrlRule)
            .mockResolvedValueOnce({ data: [{ id: 'bw-1', name: 'Old rule' }] })
            .mockResolvedValueOnce({
                data: [
                    { id: 'bw-1', name: 'Old rule' },
                    { id: 'bw-2', name: payload.name },
                ],
            });

        registerSetBandwidthControlRuleTool(mockServer, mockClient);

        const result = await toolHandler({ dryRun: false, payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'create-bandwidth-control-rule',
                target: 'site-1',
                siteId: 'site-1',
                mode: 'apply',
                status: 'submitted',
                summary: 'Bandwidth control rule mutation requested.',
                result: {
                    id: 'bw-2',
                    createdRule: { id: 'bw-2', name: payload.name },
                },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerSetBandwidthControlRuleTool(mockServer, mockClient);
        const result = (await toolHandler({ payload }, { sessionId: 'preview' })) as {
            content: { text: string }[];
            structuredContent: Record<string, unknown>;
        };
        const summary = JSON.parse(result.content[0].text);
        expect(summary).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(result.structuredContent).toEqual(expect.objectContaining(summary));
        for (const [name, operation] of Object.entries(mockClient)) {
            if (!/^(get|list|resolve)/.test(name)) expect(operation).not.toHaveBeenCalled();
        }
    });
});
