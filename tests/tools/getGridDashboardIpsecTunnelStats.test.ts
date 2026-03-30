import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridDashboardIpsecTunnelStatsTool } from '../../src/tools/getGridDashboardIpsecTunnelStats.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridDashboardIpsecTunnelStats', () => {
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
            getGridDashboardIpsecTunnelStats: vi.fn(),
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

    describe('registerGetGridDashboardIpsecTunnelStatsTool', () => {
        it('should register the getGridDashboardIpsecTunnelStats tool with correct schema', () => {
            registerGetGridDashboardIpsecTunnelStatsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridDashboardIpsecTunnelStats', expect.any(Object), expect.any(Function));
        });

        it('should successfully get IPsec tunnel stats', async () => {
            const mockData = { totalTunnels: 5, activeTunnels: 3, bytesIn: 1024, bytesOut: 2048 };

            (mockClient.getGridDashboardIpsecTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDashboardIpsecTunnelStatsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridDashboardIpsecTunnelStats).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { totalTunnels: 2, activeTunnels: 2 };

            (mockClient.getGridDashboardIpsecTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDashboardIpsecTunnelStatsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridDashboardIpsecTunnelStats).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle undefined response', async () => {
            (mockClient.getGridDashboardIpsecTunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetGridDashboardIpsecTunnelStatsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridDashboardIpsecTunnelStats as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridDashboardIpsecTunnelStatsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridDashboardIpsecTunnelStats',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
