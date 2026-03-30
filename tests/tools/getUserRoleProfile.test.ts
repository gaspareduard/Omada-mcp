import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUserRoleProfileTool } from '../../src/tools/getUserRoleProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUserRoleProfile', () => {
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
            getUserRoleProfile: vi.fn(),
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

    describe('registerGetUserRoleProfileTool', () => {
        it('should register the tool', () => {
            registerGetUserRoleProfileTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUserRoleProfile', expect.any(Object), expect.any(Function));
        });

        it('should call getUserRoleProfile (no siteId — global endpoint)', async () => {
            const mockData = [{ id: 'role-1', name: 'Admin' }];
            (mockClient.getUserRoleProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetUserRoleProfileTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getUserRoleProfile).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getUserRoleProfile as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetUserRoleProfileTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
