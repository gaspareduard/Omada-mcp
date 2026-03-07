import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListStaticRoutesTool } from '../../src/tools/listStaticRoutes.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listStaticRoutes', () => {
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
            listStaticRoutes: vi.fn(),
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

    describe('registerListStaticRoutesTool', () => {
        it('should register the listStaticRoutes tool with correct schema', () => {
            registerListStaticRoutesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listStaticRoutes', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ id: 'route-1', destination: '10.0.0.0/8', nextHop: '192.168.1.1', enabled: true }];
            (mockClient.listStaticRoutes as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListStaticRoutesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listStaticRoutes).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ id: 'route-1', destination: '10.0.0.0/8', nextHop: '192.168.1.1', enabled: true }];
            (mockClient.listStaticRoutes as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListStaticRoutesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listStaticRoutes).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listStaticRoutes as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListStaticRoutesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listStaticRoutes',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
