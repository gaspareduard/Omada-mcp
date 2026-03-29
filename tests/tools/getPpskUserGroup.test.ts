import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPpskUserGroupTool } from '../../src/tools/getPpskUserGroup.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPpskUserGroup', () => {
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

    describe('registerGetPpskUserGroupTool', () => {
        it('should register the tool', () => {
            registerGetPpskUserGroupTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPpskUserGroup', expect.any(Object), expect.any(Function));
        });

        it('should call getPpskUserGroup with profileId', async () => {
            const mockData = { users: [] };
            (mockClient.getPpskUserGroup as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPpskUserGroupTool(mockServer, mockClient);
            const result = await toolHandler({ profileId: 'profile-1' }, { sessionId: 'test' });
            expect(mockClient.getPpskUserGroup).toHaveBeenCalledWith('profile-1', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getPpskUserGroup as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetPpskUserGroupTool(mockServer, mockClient);
            await toolHandler({ profileId: 'profile-1', siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getPpskUserGroup).toHaveBeenCalledWith('profile-1', 'site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getPpskUserGroup as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetPpskUserGroupTool(mockServer, mockClient);
            await expect(toolHandler({ profileId: 'profile-1' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
