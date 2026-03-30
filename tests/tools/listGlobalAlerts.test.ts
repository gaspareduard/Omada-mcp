import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListGlobalAlertsTool } from '../../src/tools/listGlobalAlerts.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listGlobalAlerts', () => {
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
            listGlobalAlerts: vi.fn(),
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

    describe('registerListGlobalAlertsTool', () => {
        it('should register the listGlobalAlerts tool with correct schema', () => {
            registerListGlobalAlertsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listGlobalAlerts', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { result: [{ id: 'alert-1', message: 'Device offline' }] };
            (mockClient.listGlobalAlerts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListGlobalAlertsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listGlobalAlerts).toHaveBeenCalledWith(
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
            (mockClient.listGlobalAlerts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListGlobalAlertsTool(mockServer, mockClient);

            const result = await toolHandler(
                { page: 2, pageSize: 50, startTime: 1700000000000, endTime: 1700086400000, searchKey: 'offline' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.listGlobalAlerts).toHaveBeenCalledWith(
                {
                    page: 2,
                    pageSize: 50,
                    startTime: 1700000000000,
                    endTime: 1700086400000,
                    searchKey: 'offline',
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listGlobalAlerts as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListGlobalAlertsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listGlobalAlerts',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
