import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPortForwardingListTool } from '../../src/tools/getPortForwardingList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPortForwardingList', () => {
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
            getPortForwardingListPage: vi.fn(),
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

    describe('registerGetPortForwardingListTool', () => {
        it('should register the getPortForwardingList tool with correct schema', () => {
            registerGetPortForwardingListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPortForwardingList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no params', async () => {
            const mockData = { totalRows: 2, currentPage: 1, data: [] };
            (mockClient.getPortForwardingListPage as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPortForwardingListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getPortForwardingListPage).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination and siteId when provided', async () => {
            const mockData = { totalRows: 2, currentPage: 2, data: [] };
            (mockClient.getPortForwardingListPage as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPortForwardingListTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 15, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getPortForwardingListPage).toHaveBeenCalledWith(2, 15, 'test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getPortForwardingListPage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetPortForwardingListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getPortForwardingListPage as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetPortForwardingListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getPortForwardingList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
