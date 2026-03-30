import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAllRolesTool } from '../../src/tools/getAllRoles.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAllRoles', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getAllRoles: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetAllRolesTool', () => {
        it('should register the tool', () => {
            registerGetAllRolesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getAllRoles', expect.any(Object), expect.any(Function));
        });

        it('should call getAllRoles', async () => {
            const mockData = { id: 'roles-1' };
            (mockClient.getAllRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetAllRolesTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getAllRoles).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getAllRoles as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetAllRolesTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
