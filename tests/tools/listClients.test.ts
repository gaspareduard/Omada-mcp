import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListClientsTool } from '../../src/tools/listClients.js';
import type { OmadaClientInfo } from '../../src/types/index.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listClients', () => {
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
            listClients: vi.fn(),
        } as unknown as OmadaClient;

        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            // Mock implementation
        });
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should register and execute successfully', async () => {
        const mockClients: OmadaClientInfo[] = [{ mac: '00:11:22:33:44:55', name: 'Client 1', id: 'client-1' } as OmadaClientInfo];

        (mockClient.listClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockClients);

        registerListClientsTool(mockServer, mockClient);

        const result = await toolHandler({}, { sessionId: 'test-session' });

        expect(mockClient.listClients).toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: JSON.stringify(mockClients, null, 2) }],
        });
    });
});
