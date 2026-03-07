import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSiteEventsTool } from '../../src/tools/listSiteEvents.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSiteEvents', () => {
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
            listSiteEvents: vi.fn(),
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

    describe('registerListSiteEventsTool', () => {
        it('should register the listSiteEvents tool with correct schema', () => {
            registerListSiteEventsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteEvents', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { result: [{ id: 'event-1', type: 'device_online', device: 'AP1' }] };
            (mockClient.listSiteEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteEventsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listSiteEvents).toHaveBeenCalledWith(
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
            (mockClient.listSiteEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteEventsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listSiteEvents).toHaveBeenCalledWith(
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
            (mockClient.listSiteEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSiteEventsTool(mockServer, mockClient);

            await toolHandler(
                { page: 1, pageSize: 100, startTime: 1700000000000, endTime: 1700086400000, searchKey: 'AP1', siteId: 'test-site' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.listSiteEvents).toHaveBeenCalledWith(
                {
                    page: 1,
                    pageSize: 100,
                    startTime: 1700000000000,
                    endTime: 1700086400000,
                    searchKey: 'AP1',
                },
                'test-site',
                undefined
            );
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listSiteEvents as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSiteEventsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listSiteEvents',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
