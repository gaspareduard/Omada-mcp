import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetDeviceLedTool } from '../../src/tools/setDeviceLed.js';

describe('tools/setDeviceLed', () => {
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
            setDeviceLed: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('calls the set device LED action when not in dry-run mode', async () => {
        registerSetDeviceLedTool(mockServer, mockClient);
        await toolHandler({ deviceMac: 'AA:BB:CC:DD:EE:FF', ledSetting: 1, siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.setDeviceLed).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 1, 'site-1', undefined);
    });

    it('returns a dry-run summary without calling the controller', async () => {
        registerSetDeviceLedTool(mockServer, mockClient);
        const result = await toolHandler({ deviceMac: 'AA:BB:CC:DD:EE:FF', ledSetting: 2, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.setDeviceLed).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-device-led',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned LED setting 2 for device AA:BB:CC:DD:EE:FF.',
                            result: { accepted: true, dryRun: true, ledSetting: 2 },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });
});
