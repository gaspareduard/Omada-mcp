import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteBandwidthControlRuleTool } from '../../src/tools/deleteBandwidthControlRule.js';

describe('tools/deleteBandwidthControlRule', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getGridBandwidthCtrlRule: vi.fn().mockResolvedValue({ data: [{ id: 'bw-1', name: 'Old rule' }] }),
            deleteBandwidthCtrlRule: vi.fn().mockResolvedValue({ ok: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview', async () => {
        registerDeleteBandwidthControlRuleTool(mockServer, mockClient);

        const result = await toolHandler({ ruleId: 'bw-1', dryRun: true }, { sessionId: 's1' });

        expect(mockClient.deleteBandwidthCtrlRule).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'delete-bandwidth-control-rule',
                            target: 'bw-1',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned bandwidth control rule deletion for bw-1.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: { id: 'bw-1', name: 'Old rule' },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('deletes the bandwidth rule through the client', async () => {
        registerDeleteBandwidthControlRuleTool(mockServer, mockClient);

        await toolHandler({ ruleId: 'bw-1', siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.deleteBandwidthCtrlRule).toHaveBeenCalledWith('bw-1', 'site-1', undefined);
    });
});
