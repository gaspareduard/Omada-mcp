import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGlobalDashboardOverviewTool } from '../../src/tools/getGlobalDashboardOverview.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGlobalDashboardOverview', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getGlobalDashboardOverview: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetGlobalDashboardOverviewTool', () => {
        it('should register the tool', () => {
            registerGetGlobalDashboardOverviewTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGlobalDashboardOverview', expect.any(Object), expect.any(Function));
        });

        it('should call getGlobalDashboardOverview', async () => {
            const mockData = { id: 'overview-1' };
            (mockClient.getGlobalDashboardOverview as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGlobalDashboardOverviewTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getGlobalDashboardOverview).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getGlobalDashboardOverview as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetGlobalDashboardOverviewTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
