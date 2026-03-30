import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListDevicesStatsTool } from '../../src/tools/listDevicesStats.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listDevicesStats', () => {
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
            listDevicesStats: vi.fn(),
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

    describe('registerListDevicesStatsTool', () => {
        it('should register the listDevicesStats tool with correct schema', () => {
            registerListDevicesStatsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listDevicesStats', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { totalRows: 3, data: [{ mac: 'AA-BB-CC-DD-EE-FF', name: 'Switch 1' }] };
            (mockClient.listDevicesStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListDevicesStatsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listDevicesStats).toHaveBeenCalledWith(
                {
                    page: undefined,
                    pageSize: undefined,
                    searchMacs: undefined,
                    searchNames: undefined,
                    searchModels: undefined,
                    searchSns: undefined,
                    filterTag: undefined,
                    filterDeviceSeriesType: undefined,
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with all optional args', async () => {
            const mockData = { totalRows: 1, data: [{ mac: '11-22-33-44-55-66', name: 'AP 1' }] };
            (mockClient.listDevicesStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListDevicesStatsTool(mockServer, mockClient);

            const result = await toolHandler(
                {
                    page: 1,
                    pageSize: 50,
                    searchMacs: 'AA-BB',
                    searchNames: 'Switch',
                    searchModels: 'TL-SG',
                    searchSns: 'SN123',
                    filterTag: 'production',
                    filterDeviceSeriesType: '1',
                },
                { sessionId: 'test-session' }
            );

            expect(mockClient.listDevicesStats).toHaveBeenCalledWith(
                {
                    page: 1,
                    pageSize: 50,
                    searchMacs: 'AA-BB',
                    searchNames: 'Switch',
                    searchModels: 'TL-SG',
                    searchSns: 'SN123',
                    filterTag: 'production',
                    filterDeviceSeriesType: '1',
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listDevicesStats as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListDevicesStatsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listDevicesStats',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
