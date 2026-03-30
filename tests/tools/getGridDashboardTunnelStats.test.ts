import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridDashboardTunnelStatsTool } from '../../src/tools/getGridDashboardTunnelStats.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridDashboardTunnelStats', () => {
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
            getGridDashboardTunnelStats: vi.fn(),
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

    describe('registerGetGridDashboardTunnelStatsTool', () => {
        it('should register the getGridDashboardTunnelStats tool with correct schema', () => {
            registerGetGridDashboardTunnelStatsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridDashboardTunnelStats', expect.any(Object), expect.any(Function));
        });

        it('should successfully get VPN tunnel stats for server role', async () => {
            const mockData = { totalTunnels: 4, activeTunnels: 2 };

            (mockClient.getGridDashboardTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDashboardTunnelStatsTool(mockServer, mockClient);

            const result = await toolHandler({ type: 0 }, { sessionId: 'test-session' });

            expect(mockClient.getGridDashboardTunnelStats).toHaveBeenCalledWith(undefined, 0, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should successfully get VPN tunnel stats for client role', async () => {
            const mockData = { totalTunnels: 1, activeTunnels: 1 };

            (mockClient.getGridDashboardTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDashboardTunnelStatsTool(mockServer, mockClient);

            await toolHandler({ type: 1 }, { sessionId: 'test-session' });

            expect(mockClient.getGridDashboardTunnelStats).toHaveBeenCalledWith(undefined, 1, undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { totalTunnels: 0, activeTunnels: 0 };

            (mockClient.getGridDashboardTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDashboardTunnelStatsTool(mockServer, mockClient);

            await toolHandler({ type: 0, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridDashboardTunnelStats).toHaveBeenCalledWith('test-site', 0, undefined);
        });

        it('should handle undefined response', async () => {
            (mockClient.getGridDashboardTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetGridDashboardTunnelStatsTool(mockServer, mockClient);

            const result = await toolHandler({ type: 0 }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridDashboardTunnelStats as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridDashboardTunnelStatsTool(mockServer, mockClient);

            await expect(toolHandler({ type: 0 }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridDashboardTunnelStats',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
