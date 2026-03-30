import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridAllowListTool } from '../../src/tools/getGridAllowList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridAllowList', () => {
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
            getGridAllowList: vi.fn(),
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

    describe('registerGetGridAllowListTool', () => {
        it('should register the getGridAllowList tool with correct schema', () => {
            registerGetGridAllowListTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridAllowList', expect.any(Object), expect.any(Function));
        });

        it('should successfully get IPS allow list with defaults', async () => {
            const mockData = { data: [{ id: '1', ip: '192.168.1.1' }], totalRows: 1 };

            (mockClient.getGridAllowList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridAllowListTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridAllowList).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination and search params when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridAllowList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridAllowListTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20, searchKey: 'test', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridAllowList).toHaveBeenCalledWith(2, 20, 'test', 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridAllowList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridAllowListTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridAllowList).toHaveBeenCalledWith(1, 10, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridAllowList as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridAllowListTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridAllowList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
