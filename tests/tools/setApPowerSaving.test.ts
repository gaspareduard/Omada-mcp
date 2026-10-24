import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetApPowerSavingTool } from '../../src/tools/setApPowerSaving.js';

describe('tools/setApPowerSaving', () => {
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
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
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
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('throws when the AP does not support power-saving configuration', async () => {
        vi.mocked(mockClient.getSitesApsPowerSaving).mockResolvedValue({ supportPowerSaving: false } as never);

        registerSetApPowerSavingTool(mockServer, mockClient);

        await expect(
            toolHandler({ dryRun: false, apMac: 'AA:BB:CC:DD:EE:FF', timeEnable: false, bandEnable: false }, { sessionId: 's1' })
        ).rejects.toThrow('AP AA:BB:CC:DD:EE:FF does not support power-saving configuration.');
    });

    it('calls the controller when validation succeeds', async () => {
        registerSetApPowerSavingTool(mockServer, mockClient);

        await toolHandler(
            {
                dryRun: false,
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
            toolHandler({ dryRun: false, apMac: 'AA:BB:CC:DD:EE:FF', timeEnable: true, bandEnable: false }, { sessionId: 's1' })
        ).rejects.toThrow();
    });

    it('rejects missing band settings when idle-based saving is enabled', async () => {
        registerSetApPowerSavingTool(mockServer, mockClient);

        await expect(
            toolHandler({ dryRun: false, apMac: 'AA:BB:CC:DD:EE:FF', timeEnable: false, bandEnable: true }, { sessionId: 's1' })
        ).rejects.toThrow();
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerSetApPowerSavingTool(mockServer, mockClient);
        const result = (await toolHandler(
            { apMac: 'AA:BB:CC:DD:EE:FF', timeEnable: false, bandEnable: true, bands: [1], idleDuration: 120 },
            { sessionId: 'preview' }
        )) as { content: { text: string }[]; structuredContent: Record<string, unknown> };
        const summary = JSON.parse(result.content[0].text);
        expect(summary).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(result.structuredContent).toEqual(expect.objectContaining(summary));
        for (const [name, operation] of Object.entries(mockClient)) {
            if (!/^(get|list|resolve)/.test(name)) expect(operation).not.toHaveBeenCalled();
        }
    });
});
