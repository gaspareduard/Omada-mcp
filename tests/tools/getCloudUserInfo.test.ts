import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetCloudUserInfoTool } from '../../src/tools/getCloudUserInfo.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getCloudUserInfo', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getCloudUserInfo: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetCloudUserInfoTool', () => {
        it('should register the tool', () => {
            registerGetCloudUserInfoTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getCloudUserInfo', expect.any(Object), expect.any(Function));
        });

        it('should call getCloudUserInfo', async () => {
            const mockData = { id: 'user-1' };
            (mockClient.getCloudUserInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetCloudUserInfoTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getCloudUserInfo).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getCloudUserInfo as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetCloudUserInfoTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
