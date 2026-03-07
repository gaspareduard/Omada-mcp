import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetOuiProfileListTool } from '../../src/tools/getOuiProfileList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getOuiProfileList', () => {
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
            getOuiProfileList: vi.fn(),
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

    describe('registerGetOuiProfileListTool', () => {
        it('should register the getOuiProfileList tool with correct schema', () => {
            registerGetOuiProfileListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getOuiProfileList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 10, currentPage: 1, data: [] };
            (mockClient.getOuiProfileList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetOuiProfileListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getOuiProfileList).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination params and siteId when provided', async () => {
            const mockData = { totalRows: 10, currentPage: 2, data: [] };
            (mockClient.getOuiProfileList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetOuiProfileListTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 25, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getOuiProfileList).toHaveBeenCalledWith(2, 25, 'test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getOuiProfileList as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetOuiProfileListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getOuiProfileList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetOuiProfileListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getOuiProfileList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
