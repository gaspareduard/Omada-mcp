import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListWireguardTool } from '../../src/tools/listWireguard.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listWireguard', () => {
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
            listWireguard: vi.fn(),
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

    describe('registerListWireguardTool', () => {
        it('should register the listWireguard tool with correct schema', () => {
            registerListWireguardTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listWireguard', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args using defaults', async () => {
            const mockData = [{ id: 'wg-1', name: 'wg0', listenPort: 51820 }];
            (mockClient.listWireguard as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListWireguardTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listWireguard).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination and searchKey when provided', async () => {
            const mockData = [{ id: 'wg-1', name: 'wg0', listenPort: 51820 }];
            (mockClient.listWireguard as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListWireguardTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20, searchKey: 'wg0' }, { sessionId: 'test-session' });

            expect(mockClient.listWireguard).toHaveBeenCalledWith(2, 20, 'wg0', undefined, undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = [];
            (mockClient.listWireguard as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListWireguardTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listWireguard).toHaveBeenCalledWith(1, 10, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listWireguard as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListWireguardTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listWireguard',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
