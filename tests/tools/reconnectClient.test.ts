import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerReconnectClientTool } from '../../src/tools/reconnectClient.js';

describe('tools/reconnectClient', () => {
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
            reconnectClient: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('calls the reconnect client action when not in dry-run mode', async () => {
        registerReconnectClientTool(mockServer, mockClient);
        await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.reconnectClient).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
    });

    it('returns a dry-run summary without calling the controller', async () => {
        registerReconnectClientTool(mockServer, mockClient);
        const result = await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', dryRun: true }, { sessionId: 's1' });

        expect(mockClient.reconnectClient).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'reconnect-client',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned client reconnect for AA:BB:CC:DD:EE:FF.',
                            result: { accepted: true, dryRun: true },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });
});
