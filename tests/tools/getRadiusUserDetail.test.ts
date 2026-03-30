import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRadiusUserDetailTool } from '../../src/tools/getRadiusUserDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRadiusUserDetail', () => {
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

    describe('registerGetRadiusUserDetailTool', () => {
        it('should register with [DEPRECATED] in description', () => {
            registerGetRadiusUserDetailTool(mockServer, mockClient);
            const call = (mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[0]).toBe('getRadiusUserDetail');
            expect(call[1].description).toMatch(/\[DEPRECATED\]/);
        });

        it('should delegate to getRadiusUserList', async () => {
            const mockData = { data: [] };
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadiusUserDetailTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' });
            expect(mockClient.getRadiusUserList).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getRadiusUserList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetRadiusUserDetailTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
