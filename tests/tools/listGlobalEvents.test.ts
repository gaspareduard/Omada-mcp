import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListGlobalEventsTool } from '../../src/tools/listGlobalEvents.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listGlobalEvents', () => {
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
            listGlobalEvents: vi.fn(),
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

    describe('registerListGlobalEventsTool', () => {
        it('should register the listGlobalEvents tool with correct schema', () => {
            registerListGlobalEventsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listGlobalEvents', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { result: [{ id: 'event-1', message: 'Device online' }] };
            (mockClient.listGlobalEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListGlobalEventsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listGlobalEvents).toHaveBeenCalledWith(
                {
                    page: undefined,
                    pageSize: undefined,
                    startTime: undefined,
                    endTime: undefined,
                    searchKey: undefined,
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with pagination and filter args', async () => {
            const mockData = { result: [] };
            (mockClient.listGlobalEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListGlobalEventsTool(mockServer, mockClient);

            await toolHandler(
                { page: 1, pageSize: 20, startTime: 1700000000000, endTime: 1700086400000, searchKey: 'connect' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.listGlobalEvents).toHaveBeenCalledWith(
                {
                    page: 1,
                    pageSize: 20,
                    startTime: 1700000000000,
                    endTime: 1700086400000,
                    searchKey: 'connect',
                },
                undefined
            );
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listGlobalEvents as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListGlobalEventsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listGlobalEvents',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
