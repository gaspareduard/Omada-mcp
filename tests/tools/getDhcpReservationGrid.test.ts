import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDhcpReservationGridTool } from '../../src/tools/getDhcpReservationGrid.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDhcpReservationGrid', () => {
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
            getDhcpReservationGrid: vi.fn(),
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

    describe('registerGetDhcpReservationGridTool', () => {
        it('should register the getDhcpReservationGrid tool with correct schema', () => {
            registerGetDhcpReservationGridTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDhcpReservationGrid', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 3, currentPage: 1, data: [] };
            (mockClient.getDhcpReservationGrid as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDhcpReservationGridTool(mockServer, mockClient);

            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' });

            expect(mockClient.getDhcpReservationGrid).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { totalRows: 0, currentPage: 1, data: [] };
            (mockClient.getDhcpReservationGrid as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDhcpReservationGridTool(mockServer, mockClient);

            await toolHandler({ page: 1, pageSize: 10, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDhcpReservationGrid).toHaveBeenCalledWith(1, 10, 'test-site', undefined);
        });

        it('should pass custom pagination parameters', async () => {
            const mockData = { totalRows: 50, currentPage: 3, data: [] };
            (mockClient.getDhcpReservationGrid as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDhcpReservationGridTool(mockServer, mockClient);

            await toolHandler({ page: 3, pageSize: 20 }, { sessionId: 'test-session' });

            expect(mockClient.getDhcpReservationGrid).toHaveBeenCalledWith(3, 20, undefined, undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDhcpReservationGrid as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDhcpReservationGridTool(mockServer, mockClient);

            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDhcpReservationGrid',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
