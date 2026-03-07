import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSiteAuditLogsTool } from '../../src/tools/listSiteAuditLogs.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSiteAuditLogs', () => {
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
            listSiteAuditLogs: vi.fn(),
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

    describe('registerListSiteAuditLogsTool', () => {
        it('should register the listSiteAuditLogs tool with correct schema', () => {
            registerListSiteAuditLogsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteAuditLogs', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { result: [{ id: 'log-1', user: 'admin', action: 'update config' }] };
            (mockClient.listSiteAuditLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteAuditLogsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listSiteAuditLogs).toHaveBeenCalledWith(
                {
                    page: undefined,
                    pageSize: undefined,
                    startTime: undefined,
                    endTime: undefined,
                    searchKey: undefined,
                },
                undefined,
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { result: [] };
            (mockClient.listSiteAuditLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteAuditLogsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listSiteAuditLogs).toHaveBeenCalledWith(
                {
                    page: undefined,
                    pageSize: undefined,
                    startTime: undefined,
                    endTime: undefined,
                    searchKey: undefined,
                },
                'test-site',
                undefined
            );
        });

        it('should pass all filter args', async () => {
            const mockData = { result: [] };
            (mockClient.listSiteAuditLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteAuditLogsTool(mockServer, mockClient);

            await toolHandler(
                { page: 2, pageSize: 25, startTime: 1700000000000, endTime: 1700086400000, searchKey: 'admin', siteId: 'test-site' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.listSiteAuditLogs).toHaveBeenCalledWith(
                {
                    page: 2,
                    pageSize: 25,
                    startTime: 1700000000000,
                    endTime: 1700086400000,
                    searchKey: 'admin',
                },
                'test-site',
                undefined
            );
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listSiteAuditLogs as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSiteAuditLogsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listSiteAuditLogs',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
