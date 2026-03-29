import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPpskUserListTool } from '../../src/tools/getPpskUserList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPpskUserList', () => {
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
            getPpskUserGroup: vi.fn(),
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

    describe('registerGetPpskUserListTool', () => {
        it('should register with [DEPRECATED] in description', () => {
            registerGetPpskUserListTool(mockServer, mockClient);
            const call = (mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(call[0]).toBe('getPpskUserList');
            expect(call[1].description).toMatch(/\[DEPRECATED\]/);
        });

        it('should delegate to getPpskUserGroup', async () => {
            const mockData = { users: [] };
            (mockClient.getPpskUserGroup as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPpskUserListTool(mockServer, mockClient);
            await toolHandler({ profileId: 'profile-1' }, { sessionId: 'test' });
            expect(mockClient.getPpskUserGroup).toHaveBeenCalledWith('profile-1', undefined, undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getPpskUserGroup as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetPpskUserListTool(mockServer, mockClient);
            await expect(toolHandler({ profileId: 'profile-1' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
