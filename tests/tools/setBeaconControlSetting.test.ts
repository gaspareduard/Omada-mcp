import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetBeaconControlSettingTool } from '../../src/tools/setBeaconControlSetting.js';

describe('tools/setBeaconControlSetting', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const currentSettings = {
        beaconControl: {
            beaconIntvMode2g: 0,
            dtimPeriod2g: 1,
            rtsThreshold2g: 2347,
            beaconIntvMode5g: 0,
            dtimPeriod5g: 1,
            rtsThreshold5g: 2347,
            beaconIntvMode6g: 0,
            dtimPeriod6g: 1,
            rtsThreshold6g: 2347,
        },
        airtimeFairness: { enable2g: false, enable5g: false, enable6g: false },
    };

    const payload = {
        beaconControl: currentSettings.beaconControl,
        airtimeFairness: { enable2g: true, enable5g: true, enable6g: false },
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getBeaconControlSetting: vi.fn().mockResolvedValue(currentSettings),
            setBeaconControlSetting: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview with the current beacon control settings', async () => {
        registerSetBeaconControlSettingTool(mockServer, mockClient);

        const result = await toolHandler({ payload, dryRun: true, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.setBeaconControlSetting).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-beacon-control-setting',
                            target: 'site-1',
                            siteId: 'site-1',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned beacon control settings update.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: currentSettings,
                                plannedConfig: payload,
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('applies beacon control settings through the client', async () => {
        registerSetBeaconControlSettingTool(mockServer, mockClient);

        await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.setBeaconControlSetting).toHaveBeenCalledWith(payload, 'site-1', undefined);
    });
});
