import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetInternetLoadBalanceTool } from '../../src/tools/getInternetLoadBalance.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getInternetLoadBalance', () => {
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
            getInternetLoadBalance: vi.fn(),
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

    describe('registerGetInternetLoadBalanceTool', () => {
        it('should register the getInternetLoadBalance tool with correct schema', () => {
            registerGetInternetLoadBalanceTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getInternetLoadBalance', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { mode: 'failover' };
            (mockClient.getInternetLoadBalance as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInternetLoadBalanceTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getInternetLoadBalance).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { mode: 'load-balance' };
            (mockClient.getInternetLoadBalance as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInternetLoadBalanceTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getInternetLoadBalance).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getInternetLoadBalance as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetInternetLoadBalanceTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getInternetLoadBalance',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
