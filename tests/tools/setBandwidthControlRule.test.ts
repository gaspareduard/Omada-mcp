import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetBandwidthControlRuleTool } from '../../src/tools/setBandwidthControlRule.js';

describe('tools/setBandwidthControlRule', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

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
                toolHandler = handler;
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
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
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
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('throws when updating a missing bandwidth rule', async () => {
        registerSetBandwidthControlRuleTool(mockServer, mockClient);

        await expect(toolHandler({ ruleId: 'missing', payload }, { sessionId: 's1' })).rejects.toThrow(
            'No bandwidth control rule exists for missing.'
        );
    });

    it('rejects unknown LAN/WAN references before mutating', async () => {
        registerSetBandwidthControlRuleTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
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

        await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.createBandwidthCtrlRule).toHaveBeenCalledWith(payload, 'site-1', undefined);

        await toolHandler({ ruleId: 'bw-1', payload, siteId: 'site-1' }, { sessionId: 's1' });
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

        const result = await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'create-bandwidth-control-rule',
                            target: 'site-1',
                            siteId: 'site-1',
                            mode: 'apply',
                            status: 'applied',
                            summary: 'Bandwidth control rule mutation requested.',
                            result: {
                                id: 'bw-2',
                                createdRule: { id: 'bw-2', name: payload.name },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });
});
