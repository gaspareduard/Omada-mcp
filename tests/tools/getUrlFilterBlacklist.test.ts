import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUrlFilterBlacklistTool } from '../../src/tools/getUrlFilterBlacklist.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUrlFilterBlacklist', () => {
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
            getGridDenyMacFiltering: vi.fn(),
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

    describe('registerGetUrlFilterBlacklistTool', () => {
        it('should register the tool', () => {
            registerGetUrlFilterBlacklistTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUrlFilterBlacklist', expect.any(Object), expect.any(Function));
        });

        it('should delegate to getGridDenyMacFiltering', async () => {
            const mockData = { data: [] };
            (mockClient.getGridDenyMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetUrlFilterBlacklistTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' });
            expect(mockClient.getGridDenyMacFiltering).toHaveBeenCalledWith(1, 10, undefined, undefined);
        });

        it('should pass siteId', async () => {
            (mockClient.getGridDenyMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetUrlFilterBlacklistTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 5, siteId: 'site-x' }, { sessionId: 'test' });
            expect(mockClient.getGridDenyMacFiltering).toHaveBeenCalledWith(2, 5, 'site-x', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getGridDenyMacFiltering as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetUrlFilterBlacklistTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
