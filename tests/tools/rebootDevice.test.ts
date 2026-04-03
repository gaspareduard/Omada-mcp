import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerRebootDeviceTool } from '../../src/tools/rebootDevice.js';

describe('tools/rebootDevice', () => {
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
            rebootDevice: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('registers the rebootDevice tool', () => {
        registerRebootDeviceTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('rebootDevice', expect.any(Object), expect.any(Function));
    });

    it('returns a dry-run summary without calling the controller', async () => {
        registerRebootDeviceTool(mockServer, mockClient);
        const result = await toolHandler({ deviceMac: 'AA:BB:CC:DD:EE:FF', dryRun: true }, { sessionId: 's1' });
        expect(mockClient.rebootDevice).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'reboot-device',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned reboot for device AA:BB:CC:DD:EE:FF.',
                            result: { accepted: true, dryRun: true },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('calls the controller when not in dry-run mode', async () => {
        registerRebootDeviceTool(mockServer, mockClient);
        await toolHandler({ deviceMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.rebootDevice).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
    });
});
