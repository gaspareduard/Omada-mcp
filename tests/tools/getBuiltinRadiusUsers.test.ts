import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetBuiltinRadiusUsersTool } from '../../src/tools/getBuiltinRadiusUsers.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getBuiltinRadiusUsers', () => {
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
            getRadiusUserList: vi.fn(),
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

    describe('registerGetBuiltinRadiusUsersTool', () => {
        it('should register the tool', () => {
            registerGetBuiltinRadiusUsersTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getBuiltinRadiusUsers', expect.any(Object), expect.any(Function));
        });

        it('should call getRadiusUserList with pagination params', async () => {
            const mockData = { data: [], totalRows: 0 };
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetBuiltinRadiusUsersTool(mockServer, mockClient);
            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' });
            expect(mockClient.getRadiusUserList).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId and sortUsername', async () => {
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetBuiltinRadiusUsersTool(mockServer, mockClient);
            await toolHandler({ page: 2, pageSize: 20, sortUsername: 'asc', siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getRadiusUserList).toHaveBeenCalledWith(2, 20, 'asc', 'site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetBuiltinRadiusUsersTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
