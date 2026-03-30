import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetStackNetworkListTool } from '../../src/tools/getStackNetworkList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getStackNetworkList', () => {
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
            getStackNetworkList: vi.fn(),
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

    describe('registerGetStackNetworkListTool', () => {
        it('should register the getStackNetworkList tool with correct schema', () => {
            registerGetStackNetworkListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getStackNetworkList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required stackId', async () => {
            const mockData = { result: { data: [] } };
            (mockClient.getStackNetworkList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetStackNetworkListTool(mockServer, mockClient);
            const result = await toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' });
            expect(mockClient.getStackNetworkList).toHaveBeenCalledWith('stack-123', 1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with stackId, pagination, and siteId', async () => {
            const mockData = { result: { data: [{ vlan: 10 }] } };
            (mockClient.getStackNetworkList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetStackNetworkListTool(mockServer, mockClient);
            const result = await toolHandler({ stackId: 'stack-123', page: 1, pageSize: 10, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getStackNetworkList).toHaveBeenCalledWith('stack-123', 1, 10, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getStackNetworkList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetStackNetworkListTool(mockServer, mockClient);
            await expect(toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getStackNetworkList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
