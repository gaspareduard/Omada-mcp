import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListPolicyRoutesTool } from '../../src/tools/listPolicyRoutes.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listPolicyRoutes', () => {
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
            listPolicyRoutes: vi.fn(),
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

    describe('registerListPolicyRoutesTool', () => {
        it('should register the listPolicyRoutes tool with correct schema', () => {
            registerListPolicyRoutesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listPolicyRoutes', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ id: 'route-1', name: 'WAN2 Route', enabled: true }];
            (mockClient.listPolicyRoutes as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListPolicyRoutesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listPolicyRoutes).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ id: 'route-1', name: 'WAN2 Route', enabled: true }];
            (mockClient.listPolicyRoutes as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListPolicyRoutesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listPolicyRoutes).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listPolicyRoutes as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListPolicyRoutesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listPolicyRoutes',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
