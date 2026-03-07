import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetInterfaceLanNetworkV2Tool } from '../../src/tools/getInterfaceLanNetworkV2.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getInterfaceLanNetworkV2', () => {
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
            getInterfaceLanNetworkV2: vi.fn(),
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

    describe('registerGetInterfaceLanNetworkV2Tool', () => {
        it('should register the getInterfaceLanNetworkV2 tool with correct schema', () => {
            registerGetInterfaceLanNetworkV2Tool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getInterfaceLanNetworkV2', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { interfaces: [] };
            (mockClient.getInterfaceLanNetworkV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInterfaceLanNetworkV2Tool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getInterfaceLanNetworkV2).toHaveBeenCalledWith(undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type filter (WAN)', async () => {
            const mockData = { interfaces: [{ type: 0 }] };
            (mockClient.getInterfaceLanNetworkV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInterfaceLanNetworkV2Tool(mockServer, mockClient);
            const result = await toolHandler({ type: 0 }, { sessionId: 'test-session' });
            expect(mockClient.getInterfaceLanNetworkV2).toHaveBeenCalledWith(0, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type filter (LAN) and siteId', async () => {
            const mockData = { interfaces: [{ type: 1 }] };
            (mockClient.getInterfaceLanNetworkV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInterfaceLanNetworkV2Tool(mockServer, mockClient);
            const result = await toolHandler({ type: 1, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getInterfaceLanNetworkV2).toHaveBeenCalledWith(1, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getInterfaceLanNetworkV2 as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetInterfaceLanNetworkV2Tool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getInterfaceLanNetworkV2',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
