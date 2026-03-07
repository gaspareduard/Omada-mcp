import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetWanLanStatusTool } from '../../src/tools/getWanLanStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getWanLanStatus', () => {
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
            getWanLanStatus: vi.fn(),
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

    describe('registerGetWanLanStatusTool', () => {
        it('should register the getWanLanStatus tool with correct schema', () => {
            registerGetWanLanStatusTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWanLanStatus', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { wanConnected: true, lanClients: 10 };
            (mockClient.getWanLanStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWanLanStatusTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getWanLanStatus).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { wanConnected: false, lanClients: 0 };
            (mockClient.getWanLanStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWanLanStatusTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getWanLanStatus).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getWanLanStatus as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetWanLanStatusTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getWanLanStatus',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
