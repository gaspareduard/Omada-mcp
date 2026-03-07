import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListEapAclsTool } from '../../src/tools/listEapAcls.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listEapAcls', () => {
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
            listEapAcls: vi.fn(),
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

    describe('registerListEapAclsTool', () => {
        it('should register the listEapAcls tool with correct schema', () => {
            registerListEapAclsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listEapAcls', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ name: 'Block Rule 1', action: 'deny', enabled: true }];
            (mockClient.listEapAcls as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListEapAclsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listEapAcls).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = [{ name: 'Allow Rule 1', action: 'allow', enabled: false }];
            (mockClient.listEapAcls as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListEapAclsTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listEapAcls).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listEapAcls as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListEapAclsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listEapAcls',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
