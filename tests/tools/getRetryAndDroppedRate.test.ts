import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRetryAndDroppedRateTool } from '../../src/tools/getRetryAndDroppedRate.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRetryAndDroppedRate', () => {
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
            getRetryAndDroppedRate: vi.fn(),
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

    describe('registerGetRetryAndDroppedRateTool', () => {
        it('should register the getRetryAndDroppedRate tool with correct schema', () => {
            registerGetRetryAndDroppedRateTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRetryAndDroppedRate', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required args', async () => {
            const mockData = { retryRate: 5.2, droppedRate: 1.1 };
            (mockClient.getRetryAndDroppedRate as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRetryAndDroppedRateTool(mockServer, mockClient);
            const result = await toolHandler({ start: 1682000000, end: 1682086400 }, { sessionId: 'test-session' });
            expect(mockClient.getRetryAndDroppedRate).toHaveBeenCalledWith(undefined, 1682000000, 1682086400, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { retryRate: 3.0, droppedRate: 0.5 };
            (mockClient.getRetryAndDroppedRate as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRetryAndDroppedRateTool(mockServer, mockClient);
            const result = await toolHandler({ start: 1682000000, end: 1682086400, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getRetryAndDroppedRate).toHaveBeenCalledWith('test-site', 1682000000, 1682086400, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRetryAndDroppedRate as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRetryAndDroppedRateTool(mockServer, mockClient);
            await expect(toolHandler({ start: 1682000000, end: 1682086400 }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRetryAndDroppedRate',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
