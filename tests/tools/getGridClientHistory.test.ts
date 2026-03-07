import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridClientHistoryTool } from '../../src/tools/getGridClientHistory.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridClientHistory', () => {
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
            getGridClientHistory: vi.fn(),
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

    describe('registerGetGridClientHistoryTool', () => {
        it('should register the getGridClientHistory tool with correct schema', () => {
            registerGetGridClientHistoryTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridClientHistory', expect.any(Object), expect.any(Function));
        });

        it('should successfully get client history with defaults', async () => {
            const mockData = { data: [{ timestamp: 1234567890, ssid: 'MyNetwork' }], totalRows: 1 };

            (mockClient.getGridClientHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridClientHistoryTool(mockServer, mockClient);

            const result = await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getGridClientHistory).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 1, 10, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass all params when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridClientHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridClientHistoryTool(mockServer, mockClient);

            await toolHandler(
                { clientMac: 'AA-BB-CC-DD-EE-FF', page: 2, pageSize: 20, searchKey: 'wifi', siteId: 'test-site' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.getGridClientHistory).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 2, 20, 'wifi', 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridClientHistory as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridClientHistoryTool(mockServer, mockClient);

            await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridClientHistory).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 1, 10, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridClientHistory as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridClientHistoryTool(mockServer, mockClient);

            await expect(toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridClientHistory',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
