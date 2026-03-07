import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetOsgCustomAclListTool } from '../../src/tools/getOsgCustomAclList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getOsgCustomAclList', () => {
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
            getOsgCustomAclList: vi.fn(),
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

    describe('registerGetOsgCustomAclListTool', () => {
        it('should register the getOsgCustomAclList tool with correct schema', () => {
            registerGetOsgCustomAclListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getOsgCustomAclList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 5, currentPage: 1, data: [] };
            (mockClient.getOsgCustomAclList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetOsgCustomAclListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getOsgCustomAclList).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination params when provided', async () => {
            const mockData = { totalRows: 5, currentPage: 2, data: [] };
            (mockClient.getOsgCustomAclList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetOsgCustomAclListTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 20, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getOsgCustomAclList).toHaveBeenCalledWith(2, 20, 'test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getOsgCustomAclList as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetOsgCustomAclListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getOsgCustomAclList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetOsgCustomAclListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getOsgCustomAclList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
