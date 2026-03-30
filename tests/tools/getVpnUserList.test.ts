import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetVpnUserListTool } from '../../src/tools/getVpnUserList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getVpnUserList', () => {
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
            getVpnUserList: vi.fn(),
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

    describe('registerGetVpnUserListTool', () => {
        it('should register the tool', () => {
            registerGetVpnUserListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getVpnUserList', expect.any(Object), expect.any(Function));
        });

        it('should call getVpnUserList with pagination params', async () => {
            const mockData = { data: [], totalRows: 0 };
            (mockClient.getVpnUserList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetVpnUserListTool(mockServer, mockClient);
            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' });
            expect(mockClient.getVpnUserList).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getVpnUserList as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetVpnUserListTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 20, siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getVpnUserList).toHaveBeenCalledWith(1, 20, 'site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getVpnUserList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetVpnUserListTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
