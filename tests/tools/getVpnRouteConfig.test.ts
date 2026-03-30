import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetVpnRouteConfigTool } from '../../src/tools/getVpnRouteConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getVpnRouteConfig', () => {
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

    describe('registerGetVpnRouteConfigTool', () => {
        it('should register the tool', () => {
            registerGetVpnRouteConfigTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getVpnRouteConfig', expect.any(Object), expect.any(Function));
        });

        it('should delegate to listPolicyRoutes', async () => {
            const mockData = [{ id: 'route-1' }];
            (mockClient.listPolicyRoutes as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetVpnRouteConfigTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.listPolicyRoutes).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.listPolicyRoutes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetVpnRouteConfigTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.listPolicyRoutes).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.listPolicyRoutes as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetVpnRouteConfigTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
