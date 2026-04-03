import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetApChannelLimitTool } from '../../src/tools/setApChannelLimit.js';

describe('tools/setApChannelLimit', () => {
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
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
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
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('throws when the AP does not support channel-limit configuration', async () => {
        vi.mocked(mockClient.getSitesApsChannelLimit).mockResolvedValue({ supportChannelLimit: false } as never);

        registerSetApChannelLimitTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    channelLimitType: 1,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('AP AA:BB:CC:DD:EE:FF does not support channel-limit configuration.');
    });

    it('applies the channel-limit update when validation succeeds', async () => {
        registerSetApChannelLimitTool(mockServer, mockClient);

        await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                channelLimitType: 1,
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setSitesApsChannelLimit).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', { channelLimitType: 1 }, 'site-1', undefined);
    });
});
