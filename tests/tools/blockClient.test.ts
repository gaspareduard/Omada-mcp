import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerBlockClientTool } from '../../src/tools/blockClient.js';

describe('tools/blockClient', () => {
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
            blockClient: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('calls the block client action when not in dry-run mode', async () => {
        registerBlockClientTool(mockServer, mockClient);
        await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, { sessionId: 's1' });
        expect(mockClient.blockClient).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
    });

    it('returns a dry-run summary without calling the controller', async () => {
        registerBlockClientTool(mockServer, mockClient);
        const result = await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', dryRun: true }, { sessionId: 's1' });

        expect(mockClient.blockClient).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'block-client',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned client block for AA:BB:CC:DD:EE:FF.',
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
