import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUnblockClientTool } from '../../src/tools/unblockClient.js';

describe('tools/unblockClient', () => {
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
            unblockClient: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('calls the unblock client action when not in dry-run mode', async () => {
        registerUnblockClientTool(mockServer, mockClient);
        await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.unblockClient).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
    });

    it('returns a dry-run summary without calling the controller', async () => {
        registerUnblockClientTool(mockServer, mockClient);
        const result = await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', dryRun: true }, { sessionId: 's1' });

        expect(mockClient.unblockClient).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'unblock-client',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned client unblock for AA:BB:CC:DD:EE:FF.',
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
