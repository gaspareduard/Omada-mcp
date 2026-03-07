import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRoutingTableTool } from '../../src/tools/getRoutingTable.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRoutingTable', () => {
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
            getRoutingTable: vi.fn(),
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

    describe('registerGetRoutingTableTool', () => {
        it('should register the getRoutingTable tool with correct schema', () => {
            registerGetRoutingTableTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRoutingTable', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with type=static', async () => {
            const mockData = { result: { data: [] } };
            (mockClient.getRoutingTable as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRoutingTableTool(mockServer, mockClient);
            const result = await toolHandler({ type: 'static' }, { sessionId: 'test-session' });
            expect(mockClient.getRoutingTable).toHaveBeenCalledWith('static', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type=policy and siteId', async () => {
            const mockData = { result: { data: [{ destination: '10.0.0.0/8' }] } };
            (mockClient.getRoutingTable as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRoutingTableTool(mockServer, mockClient);
            const result = await toolHandler({ type: 'policy', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRoutingTable).toHaveBeenCalledWith('policy', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type=ospf', async () => {
            const mockData = { result: { data: [] } };
            (mockClient.getRoutingTable as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRoutingTableTool(mockServer, mockClient);
            const result = await toolHandler({ type: 'ospf' }, { sessionId: 'test-session' });
            expect(mockClient.getRoutingTable).toHaveBeenCalledWith('ospf', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRoutingTable as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRoutingTableTool(mockServer, mockClient);
            await expect(toolHandler({ type: 'static' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRoutingTable',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
