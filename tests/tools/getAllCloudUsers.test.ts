import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAllCloudUsersTool } from '../../src/tools/getAllCloudUsers.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAllCloudUsers', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getAllCloudUsers: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetAllCloudUsersTool', () => {
        it('should register the tool', () => {
            registerGetAllCloudUsersTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getAllCloudUsers', expect.any(Object), expect.any(Function));
        });

        it('should call getAllCloudUsers', async () => {
            const mockData = { id: 'users-1' };
            (mockClient.getAllCloudUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetAllCloudUsersTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getAllCloudUsers).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getAllCloudUsers as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetAllCloudUsersTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
