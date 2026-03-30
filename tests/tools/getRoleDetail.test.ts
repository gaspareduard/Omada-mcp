import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRoleDetailTool } from '../../src/tools/getRoleDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRoleDetail', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getRoleDetail: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetRoleDetailTool', () => {
        it('should register the tool', () => {
            registerGetRoleDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRoleDetail', expect.any(Object), expect.any(Function));
        });

        it('should call getRoleDetail with roleId', async () => {
            const mockData = { id: 'role-1' };
            (mockClient.getRoleDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRoleDetailTool(mockServer, mockClient);
            const result = await toolHandler({ roleId: 'role-1' }, { sessionId: 'test' });
            expect(mockClient.getRoleDetail).toHaveBeenCalledWith('role-1', undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getRoleDetail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetRoleDetailTool(mockServer, mockClient);
            await expect(toolHandler({ roleId: 'role-1' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
