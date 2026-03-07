import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridBlockListTool } from '../../src/tools/getGridBlockList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridBlockList', () => {
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
            getGridBlockList: vi.fn(),
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

    describe('registerGetGridBlockListTool', () => {
        it('should register the getGridBlockList tool with correct schema', () => {
            registerGetGridBlockListTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridBlockList', expect.any(Object), expect.any(Function));
        });

        it('should successfully get IPS block list with defaults', async () => {
            const mockData = { data: [{ id: '1', ip: '10.0.0.1' }], totalRows: 1 };

            (mockClient.getGridBlockList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridBlockListTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridBlockList).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination, searchKey, and siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridBlockList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridBlockListTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20, searchKey: 'malware', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridBlockList).toHaveBeenCalledWith(2, 20, 'malware', 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridBlockList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridBlockListTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridBlockList).toHaveBeenCalledWith(1, 10, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridBlockList as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridBlockListTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridBlockList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
