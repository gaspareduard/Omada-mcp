import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAuditLogsForGlobalTool } from '../../src/tools/getAuditLogsForGlobal.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAuditLogsForGlobal', () => {
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
            getAuditLogsForGlobal: vi.fn(),
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

    describe('registerGetAuditLogsForGlobalTool', () => {
        it('should register the getAuditLogsForGlobal tool with correct schema', () => {
            registerGetAuditLogsForGlobalTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getAuditLogsForGlobal', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 1, currentPage: 1, data: [{ id: 'log-1', action: 'login' }] };
            (mockClient.getAuditLogsForGlobal as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAuditLogsForGlobalTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getAuditLogsForGlobal).toHaveBeenCalledWith(
                1,
                10,
                {
                    sortTime: undefined,
                    filterResult: undefined,
                    filterLevel: undefined,
                    filterAuditTypes: undefined,
                    filterTimes: undefined,
                    searchKey: undefined,
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute with custom pagination and filters', async () => {
            const mockData = { totalRows: 5, currentPage: 2, data: [] };
            (mockClient.getAuditLogsForGlobal as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAuditLogsForGlobalTool(mockServer, mockClient);

            await toolHandler(
                { page: 2, pageSize: 20, sortTime: 'desc', filterResult: 0, filterLevel: 'info', searchKey: 'admin' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.getAuditLogsForGlobal).toHaveBeenCalledWith(
                2,
                20,
                { sortTime: 'desc', filterResult: 0, filterLevel: 'info', filterAuditTypes: undefined, filterTimes: undefined, searchKey: 'admin' },
                undefined
            );
        });

        it('should handle empty response', async () => {
            (mockClient.getAuditLogsForGlobal as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetAuditLogsForGlobalTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getAuditLogsForGlobal as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetAuditLogsForGlobalTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getAuditLogsForGlobal',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
