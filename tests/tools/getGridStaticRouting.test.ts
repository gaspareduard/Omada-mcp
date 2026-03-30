import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridStaticRoutingTool } from '../../src/tools/getGridStaticRouting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridStaticRouting', () => {
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
            getGridStaticRouting: vi.fn(),
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

    describe('registerGetGridStaticRoutingTool', () => {
        it('should register the getGridStaticRouting tool with correct schema', () => {
            registerGetGridStaticRoutingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridStaticRouting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { result: 'static routes' };
            (mockClient.getGridStaticRouting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGridStaticRoutingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getGridStaticRouting).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with pagination', async () => {
            const mockData = { result: 'static routes' };
            (mockClient.getGridStaticRouting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGridStaticRoutingTool(mockServer, mockClient);
            const result = await toolHandler({ page: 2, pageSize: 25 }, { sessionId: 'test-session' });
            expect(mockClient.getGridStaticRouting).toHaveBeenCalledWith(2, 25, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { result: 'static routes' };
            (mockClient.getGridStaticRouting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGridStaticRoutingTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getGridStaticRouting).toHaveBeenCalledWith(undefined, undefined, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridStaticRouting as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetGridStaticRoutingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridStaticRouting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
