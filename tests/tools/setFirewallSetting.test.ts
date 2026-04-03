import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetFirewallSettingTool } from '../../src/tools/setFirewallSetting.js';

describe('tools/setFirewallSetting', () => {
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
            getFirewallSetting: vi.fn().mockResolvedValue({ spi: true }),
            setFirewallSetting: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview with the current firewall settings', async () => {
        registerSetFirewallSettingTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                payload: { spi: false },
                dryRun: true,
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setFirewallSetting).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-firewall-setting',
                            target: 'site-1',
                            siteId: 'site-1',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned firewall settings update.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: { spi: true },
                                plannedConfig: { spi: false },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('applies firewall settings through the client', async () => {
        registerSetFirewallSettingTool(mockServer, mockClient);

        await toolHandler(
            {
                payload: { spi: false },
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.setFirewallSetting).toHaveBeenCalledWith({ spi: false }, 'site-1', undefined);
    });
});
