import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListWireguardPeersTool } from '../../src/tools/listWireguardPeers.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listWireguardPeers', () => {
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
            listWireguardPeers: vi.fn(),
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

    describe('registerListWireguardPeersTool', () => {
        it('should register the listWireguardPeers tool with correct schema', () => {
            registerListWireguardPeersTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listWireguardPeers', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args using defaults', async () => {
            const mockData = [{ id: 'peer-1', publicKey: 'abc123', allowedIps: '10.0.0.2/32' }];
            (mockClient.listWireguardPeers as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListWireguardPeersTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listWireguardPeers).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination args when provided', async () => {
            const mockData = [{ id: 'peer-1', publicKey: 'abc123', allowedIps: '10.0.0.2/32' }];
            (mockClient.listWireguardPeers as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListWireguardPeersTool(mockServer, mockClient);

            await toolHandler({ page: 3, pageSize: 15 }, { sessionId: 'test-session' });

            expect(mockClient.listWireguardPeers).toHaveBeenCalledWith(3, 15, undefined, undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = [];
            (mockClient.listWireguardPeers as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListWireguardPeersTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listWireguardPeers).toHaveBeenCalledWith(1, 10, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listWireguardPeers as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListWireguardPeersTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listWireguardPeers',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
