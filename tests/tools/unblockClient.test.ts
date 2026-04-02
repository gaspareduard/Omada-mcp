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
});
