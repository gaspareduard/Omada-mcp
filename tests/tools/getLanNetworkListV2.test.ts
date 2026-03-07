import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLanNetworkListV2Tool } from '../../src/tools/getLanNetworkListV2.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLanNetworkListV2', () => {
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
            getLanNetworkListV2: vi.fn(),
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

    describe('registerGetLanNetworkListV2Tool', () => {
        it('should register the getLanNetworkListV2 tool with correct schema', () => {
            registerGetLanNetworkListV2Tool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLanNetworkListV2', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { networks: [] };
            (mockClient.getLanNetworkListV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLanNetworkListV2Tool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getLanNetworkListV2).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with pagination', async () => {
            const mockData = { networks: [{ name: 'VLAN10' }] };
            (mockClient.getLanNetworkListV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLanNetworkListV2Tool(mockServer, mockClient);
            const result = await toolHandler({ page: 2, pageSize: 20 }, { sessionId: 'test-session' });
            expect(mockClient.getLanNetworkListV2).toHaveBeenCalledWith(2, 20, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { networks: [] };
            (mockClient.getLanNetworkListV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLanNetworkListV2Tool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getLanNetworkListV2).toHaveBeenCalledWith(undefined, undefined, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getLanNetworkListV2 as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetLanNetworkListV2Tool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getLanNetworkListV2',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
