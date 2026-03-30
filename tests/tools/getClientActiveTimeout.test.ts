import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientActiveTimeoutTool } from '../../src/tools/getClientActiveTimeout.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getClientActiveTimeout', () => {
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
            getClientActiveTimeout: vi.fn(),
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

    describe('registerGetClientActiveTimeoutTool', () => {
        it('should register the getClientActiveTimeout tool with correct schema', () => {
            registerGetClientActiveTimeoutTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getClientActiveTimeout', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { timeout: 300 };
            (mockClient.getClientActiveTimeout as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientActiveTimeoutTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getClientActiveTimeout).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getClientActiveTimeout as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetClientActiveTimeoutTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getClientActiveTimeout',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
