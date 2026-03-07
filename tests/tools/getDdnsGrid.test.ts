import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDdnsGridTool } from '../../src/tools/getDdnsGrid.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDdnsGrid', () => {
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
            getDdnsGrid: vi.fn(),
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

    describe('registerGetDdnsGridTool', () => {
        it('should register the getDdnsGrid tool with correct schema', () => {
            registerGetDdnsGridTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDdnsGrid', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 2, currentPage: 1, data: [] };
            (mockClient.getDdnsGrid as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDdnsGridTool(mockServer, mockClient);

            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' });

            expect(mockClient.getDdnsGrid).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { totalRows: 0, currentPage: 1, data: [] };
            (mockClient.getDdnsGrid as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDdnsGridTool(mockServer, mockClient);

            await toolHandler({ page: 1, pageSize: 10, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDdnsGrid).toHaveBeenCalledWith(1, 10, 'test-site', undefined);
        });

        it('should pass custom pagination parameters', async () => {
            const mockData = { totalRows: 100, currentPage: 2, data: [] };
            (mockClient.getDdnsGrid as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDdnsGridTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 25 }, { sessionId: 'test-session' });

            expect(mockClient.getDdnsGrid).toHaveBeenCalledWith(2, 25, undefined, undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDdnsGrid as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDdnsGridTool(mockServer, mockClient);

            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDdnsGrid',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
