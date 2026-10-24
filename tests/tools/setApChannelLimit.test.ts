import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetApChannelLimitTool } from '../../src/tools/setApChannelLimit.js';

describe('tools/setApChannelLimit', () => {
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
            getSitesApsChannelLimit: vi.fn().mockResolvedValue({ supportChannelLimit: true, channelLimitType: 0 }),
            setSitesApsChannelLimit: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary for a supported AP', async () => {
        registerSetApChannelLimitTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                channelLimitType: 2,
                dryRun: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setSitesApsChannelLimit).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'set-ap-channel-limit',
                target: 'AA:BB:CC:DD:EE:FF',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned AP channel-limit update for AA:BB:CC:DD:EE:FF.',
                result: {
                    accepted: true,
                    dryRun: true,
                    before: { supportChannelLimit: true, channelLimitType: 0 },
                    plannedConfig: { channelLimitType: 2 },
                },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('throws when the AP does not support channel-limit configuration', async () => {
        vi.mocked(mockClient.getSitesApsChannelLimit).mockResolvedValue({ supportChannelLimit: false } as never);

        registerSetApChannelLimitTool(mockServer, mockClient);

        await expect(toolHandler({ dryRun: false, apMac: 'AA:BB:CC:DD:EE:FF', channelLimitType: 1 }, { sessionId: 's1' })).rejects.toThrow(
            'AP AA:BB:CC:DD:EE:FF does not support channel-limit configuration.'
        );
    });

    it('applies the channel-limit update when validation succeeds', async () => {
        registerSetApChannelLimitTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, apMac: 'AA:BB:CC:DD:EE:FF', channelLimitType: 1, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.setSitesApsChannelLimit).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', { channelLimitType: 1 }, 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerSetApChannelLimitTool(mockServer, mockClient);
        const result = (await toolHandler({ apMac: 'AA:BB:CC:DD:EE:FF', channelLimitType: 2 }, { sessionId: 'preview' })) as {
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
