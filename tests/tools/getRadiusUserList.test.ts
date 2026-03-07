import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRadiusUserListTool } from '../../src/tools/getRadiusUserList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRadiusUserList', () => {
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
            getRadiusUserList: vi.fn(),
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

    describe('registerGetRadiusUserListTool', () => {
        it('should register the getRadiusUserList tool with correct schema', () => {
            registerGetRadiusUserListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRadiusUserList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 5, currentPage: 1, data: [] };
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadiusUserListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getRadiusUserList).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination, sortUsername, and siteId when provided', async () => {
            const mockData = { totalRows: 5, currentPage: 2, data: [] };
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadiusUserListTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 20, sortUsername: 'asc', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRadiusUserList).toHaveBeenCalledWith(2, 20, 'asc', 'test-site', undefined);
        });

        it('should pass sortUsername desc', async () => {
            const mockData = { totalRows: 5, currentPage: 1, data: [] };
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadiusUserListTool(mockServer, mockClient);
            await toolHandler({ sortUsername: 'desc' }, { sessionId: 'test-session' });
            expect(mockClient.getRadiusUserList).toHaveBeenCalledWith(1, 10, 'desc', undefined, undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetRadiusUserListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRadiusUserListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRadiusUserList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
