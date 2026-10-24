import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteBandwidthControlRuleTool } from '../../src/tools/deleteBandwidthControlRule.js';

describe('tools/deleteBandwidthControlRule', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
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
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
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
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('deletes the bandwidth rule through the client', async () => {
        registerDeleteBandwidthControlRuleTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, ruleId: 'bw-1', siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.deleteBandwidthCtrlRule).toHaveBeenCalledWith('bw-1', 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerDeleteBandwidthControlRuleTool(mockServer, mockClient);
        const result = (await toolHandler({ ruleId: 'bw-1' }, { sessionId: 'preview' })) as {
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
