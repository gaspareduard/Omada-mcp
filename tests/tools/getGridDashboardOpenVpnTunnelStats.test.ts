import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridDashboardOpenVpnTunnelStatsTool } from '../../src/tools/getGridDashboardOpenVpnTunnelStats.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridDashboardOpenVpnTunnelStats', () => {
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
            getGridDashboardOpenVpnTunnelStats: vi.fn(),
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

    describe('registerGetGridDashboardOpenVpnTunnelStatsTool', () => {
        it('should register the getGridDashboardOpenVpnTunnelStats tool with correct schema', () => {
            registerGetGridDashboardOpenVpnTunnelStatsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridDashboardOpenVpnTunnelStats', expect.any(Object), expect.any(Function));
        });

        it('should successfully get OpenVPN tunnel stats for server role', async () => {
            const mockData = { totalTunnels: 3, activeTunnels: 2, bytesIn: 512, bytesOut: 1024 };

            (mockClient.getGridDashboardOpenVpnTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDashboardOpenVpnTunnelStatsTool(mockServer, mockClient);

            const result = await toolHandler({ type: 0 }, { sessionId: 'test-session' });

            expect(mockClient.getGridDashboardOpenVpnTunnelStats).toHaveBeenCalledWith(undefined, 0, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should successfully get OpenVPN tunnel stats for client role', async () => {
            const mockData = { totalTunnels: 1, activeTunnels: 1 };

            (mockClient.getGridDashboardOpenVpnTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDashboardOpenVpnTunnelStatsTool(mockServer, mockClient);

            await toolHandler({ type: 1, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridDashboardOpenVpnTunnelStats).toHaveBeenCalledWith('test-site', 1, undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { totalTunnels: 0, activeTunnels: 0 };

            (mockClient.getGridDashboardOpenVpnTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDashboardOpenVpnTunnelStatsTool(mockServer, mockClient);

            await toolHandler({ type: 0, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridDashboardOpenVpnTunnelStats).toHaveBeenCalledWith('test-site', 0, undefined);
        });

        it('should handle undefined response', async () => {
            (mockClient.getGridDashboardOpenVpnTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetGridDashboardOpenVpnTunnelStatsTool(mockServer, mockClient);

            const result = await toolHandler({ type: 0 }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridDashboardOpenVpnTunnelStats as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridDashboardOpenVpnTunnelStatsTool(mockServer, mockClient);

            await expect(toolHandler({ type: 0 }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridDashboardOpenVpnTunnelStats',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
