import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetApPowerSavingTool } from '../../src/tools/setApPowerSaving.js';

describe('tools/setApPowerSaving', () => {
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
            getSitesApsPowerSaving: vi.fn().mockResolvedValue({ supportPowerSaving: true, timeEnable: false, bandEnable: false }),
            setSitesApsPowerSaving: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary for a supported AP', async () => {
        registerSetApPowerSavingTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                timeEnable: false,
                bandEnable: true,
                bands: [1],
                idleDuration: 120,
                dryRun: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setSitesApsPowerSaving).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-ap-power-saving',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned AP power-saving update for AA:BB:CC:DD:EE:FF.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: { supportPowerSaving: true, timeEnable: false, bandEnable: false },
                                plannedConfig: {
                                    timeEnable: false,
                                    bandEnable: true,
                                    bands: [1],
                                    idleDuration: 120,
                                },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('throws when the AP does not support power-saving configuration', async () => {
        vi.mocked(mockClient.getSitesApsPowerSaving).mockResolvedValue({ supportPowerSaving: false } as never);

        registerSetApPowerSavingTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    timeEnable: false,
                    bandEnable: false,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('AP AA:BB:CC:DD:EE:FF does not support power-saving configuration.');
    });

    it('calls the controller when validation succeeds', async () => {
        registerSetApPowerSavingTool(mockServer, mockClient);

        await toolHandler(
            {
                apMac: 'AA:BB:CC:DD:EE:FF',
                timeEnable: true,
                startTimeH: 1,
                startTimeM: 0,
                endTimeH: 6,
                endTimeM: 30,
                bandEnable: true,
                bands: [1],
                idleDuration: 120,
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setSitesApsPowerSaving).toHaveBeenCalledWith(
            'AA:BB:CC:DD:EE:FF',
            {
                timeEnable: true,
                startTimeH: 1,
                startTimeM: 0,
                endTimeH: 6,
                endTimeM: 30,
                bandEnable: true,
                bands: [1],
                idleDuration: 120,
            },
            'site-1',
            undefined
        );
    });

    it('rejects missing schedule fields when time-based saving is enabled', async () => {
        registerSetApPowerSavingTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    timeEnable: true,
                    bandEnable: false,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow();
    });

    it('rejects missing band settings when idle-based saving is enabled', async () => {
        registerSetApPowerSavingTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    apMac: 'AA:BB:CC:DD:EE:FF',
                    timeEnable: false,
                    bandEnable: true,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow();
    });
});
