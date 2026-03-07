import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSiteThreatManagementTool } from '../../src/tools/listSiteThreatManagement.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSiteThreatManagement', () => {
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
            listSiteThreatManagement: vi.fn(),
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

    describe('registerListSiteThreatManagementTool', () => {
        it('should register the listSiteThreatManagement tool with correct schema', () => {
            registerListSiteThreatManagementTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteThreatManagement', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { result: [{ id: 'threat-1', type: 'intrusion', severity: 'high' }] };
            (mockClient.listSiteThreatManagement as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteThreatManagementTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listSiteThreatManagement).toHaveBeenCalledWith(
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
            (mockClient.listSiteThreatManagement as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteThreatManagementTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listSiteThreatManagement).toHaveBeenCalledWith(
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
            (mockClient.listSiteThreatManagement as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteThreatManagementTool(mockServer, mockClient);

            await toolHandler(
                { page: 1, pageSize: 50, startTime: 1700000000000, endTime: 1700086400000, searchKey: 'intrusion', siteId: 'test-site' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.listSiteThreatManagement).toHaveBeenCalledWith(
                {
                    page: 1,
                    pageSize: 50,
                    startTime: 1700000000000,
                    endTime: 1700086400000,
                    searchKey: 'intrusion',
                },
                'test-site',
                undefined
            );
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listSiteThreatManagement as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSiteThreatManagementTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listSiteThreatManagement',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
