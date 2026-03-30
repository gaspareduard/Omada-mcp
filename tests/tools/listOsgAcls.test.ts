import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListOsgAclsTool } from '../../src/tools/listOsgAcls.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listOsgAcls', () => {
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
            listOsgAcls: vi.fn(),
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

    describe('registerListOsgAclsTool', () => {
        it('should register the listOsgAcls tool with correct schema', () => {
            registerListOsgAclsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listOsgAcls', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ id: 'acl-1', name: 'Block Guest', action: 'deny' }];
            (mockClient.listOsgAcls as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListOsgAclsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listOsgAcls).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ id: 'acl-1', name: 'Block Guest', action: 'deny' }];
            (mockClient.listOsgAcls as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListOsgAclsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listOsgAcls).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listOsgAcls as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListOsgAclsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listOsgAcls',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
