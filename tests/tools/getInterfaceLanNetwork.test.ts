import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetInterfaceLanNetworkTool } from '../../src/tools/getInterfaceLanNetwork.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getInterfaceLanNetwork', () => {
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
            getInterfaceLanNetwork: vi.fn(),
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

    describe('registerGetInterfaceLanNetworkTool', () => {
        it('should register the getInterfaceLanNetwork tool with correct schema', () => {
            registerGetInterfaceLanNetworkTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getInterfaceLanNetwork', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { interfaces: [] };
            (mockClient.getInterfaceLanNetwork as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInterfaceLanNetworkTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getInterfaceLanNetwork).toHaveBeenCalledWith(undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type filter (WAN)', async () => {
            const mockData = { interfaces: [{ type: 0 }] };
            (mockClient.getInterfaceLanNetwork as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInterfaceLanNetworkTool(mockServer, mockClient);
            const result = await toolHandler({ type: 0 }, { sessionId: 'test-session' });
            expect(mockClient.getInterfaceLanNetwork).toHaveBeenCalledWith(0, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type filter (LAN) and siteId', async () => {
            const mockData = { interfaces: [{ type: 1 }] };
            (mockClient.getInterfaceLanNetwork as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInterfaceLanNetworkTool(mockServer, mockClient);
            const result = await toolHandler({ type: 1, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getInterfaceLanNetwork).toHaveBeenCalledWith(1, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getInterfaceLanNetwork as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetInterfaceLanNetworkTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getInterfaceLanNetwork',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
