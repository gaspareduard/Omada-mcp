import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetVpnTunnelStatsTool } from '../../src/tools/getVpnTunnelStats.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getVpnTunnelStats', () => {
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
            getVpnTunnelStats: vi.fn(),
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

    describe('registerGetVpnTunnelStatsTool', () => {
        it('should register the getVpnTunnelStats tool with correct schema', () => {
            registerGetVpnTunnelStatsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getVpnTunnelStats', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 1, currentPage: 1, data: [] };
            (mockClient.getVpnTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetVpnTunnelStatsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getVpnTunnelStats).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with pagination and siteId', async () => {
            const mockData = { totalRows: 5, currentPage: 2, data: [] };
            (mockClient.getVpnTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetVpnTunnelStatsTool(mockServer, mockClient);

            const result = await toolHandler({ page: 2, pageSize: 5, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getVpnTunnelStats).toHaveBeenCalledWith(2, 5, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getVpnTunnelStats as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetVpnTunnelStatsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getVpnTunnelStats',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
