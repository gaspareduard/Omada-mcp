import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetOswAclListTool } from '../../src/tools/getOswAclList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getOswAclList', () => {
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
            getOswAclList: vi.fn(),
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

    describe('registerGetOswAclListTool', () => {
        it('should register the getOswAclList tool with correct schema', () => {
            registerGetOswAclListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getOswAclList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 3, currentPage: 1, data: [] };
            (mockClient.getOswAclList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetOswAclListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getOswAclList).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination params and siteId when provided', async () => {
            const mockData = { totalRows: 3, currentPage: 2, data: [] };
            (mockClient.getOswAclList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetOswAclListTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 5, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getOswAclList).toHaveBeenCalledWith(2, 5, 'test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getOswAclList as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetOswAclListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getOswAclList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetOswAclListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getOswAclList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
