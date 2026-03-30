import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLanNetworkListTool } from '../../src/tools/getLanNetworkList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLanNetworkList', () => {
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
            getLanNetworkList: vi.fn(),
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

    describe('registerGetLanNetworkListTool', () => {
        it('should register the getLanNetworkList tool with correct schema', () => {
            registerGetLanNetworkListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLanNetworkList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { networks: [] };
            (mockClient.getLanNetworkList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLanNetworkListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getLanNetworkList).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { networks: [{ name: 'LAN' }] };
            (mockClient.getLanNetworkList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLanNetworkListTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getLanNetworkList).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getLanNetworkList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetLanNetworkListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getLanNetworkList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
