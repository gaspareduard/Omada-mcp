import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListClientsPastConnectionsTool } from '../../src/tools/listClientsPastConnections.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listClientsPastConnections', () => {
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
            listClientsPastConnections: vi.fn(),
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

    describe('registerListClientsPastConnectionsTool', () => {
        it('should register the listClientsPastConnections tool with correct schema', () => {
            registerListClientsPastConnectionsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listClientsPastConnections', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { totalRows: 10, data: [{ mac: 'AA-BB-CC-DD-EE-FF', lastSeen: 1682000000 }] };
            (mockClient.listClientsPastConnections as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListClientsPastConnectionsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listClientsPastConnections).toHaveBeenCalledWith(
                {
                    siteId: undefined,
                    page: undefined,
                    pageSize: undefined,
                    sortLastSeen: undefined,
                    timeStart: undefined,
                    timeEnd: undefined,
                    guest: undefined,
                    searchKey: undefined,
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with all optional args', async () => {
            const mockData = { totalRows: 2, data: [] };
            (mockClient.listClientsPastConnections as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListClientsPastConnectionsTool(mockServer, mockClient);

            const result = await toolHandler(
                {
                    siteId: 'test-site',
                    page: 2,
                    pageSize: 25,
                    sortLastSeen: 'desc',
                    timeStart: 1679297710438,
                    timeEnd: 1681889710438,
                    guest: true,
                    searchKey: 'iPhone',
                },
                { sessionId: 'test-session' }
            );

            expect(mockClient.listClientsPastConnections).toHaveBeenCalledWith(
                {
                    siteId: 'test-site',
                    page: 2,
                    pageSize: 25,
                    sortLastSeen: 'desc',
                    timeStart: 1679297710438,
                    timeEnd: 1681889710438,
                    guest: true,
                    searchKey: 'iPhone',
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listClientsPastConnections as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListClientsPastConnectionsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listClientsPastConnections',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
