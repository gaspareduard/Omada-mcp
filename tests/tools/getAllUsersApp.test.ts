import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAllUsersAppTool } from '../../src/tools/getAllUsersApp.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAllUsersApp', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getAllUsersApp: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetAllUsersAppTool', () => {
        it('should register the tool', () => {
            registerGetAllUsersAppTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getAllUsersApp', expect.any(Object), expect.any(Function));
        });

        it('should call getAllUsersApp', async () => {
            const mockData = { id: 'users-1' };
            (mockClient.getAllUsersApp as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetAllUsersAppTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getAllUsersApp).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getAllUsersApp as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetAllUsersAppTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
