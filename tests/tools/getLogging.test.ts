import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLoggingTool } from '../../src/tools/getLogging.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLogging', () => {
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
            getLogging: vi.fn(),
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

    describe('registerGetLoggingTool', () => {
        it('should register the getLogging tool with correct schema', () => {
            registerGetLoggingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLogging', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { logLevel: 'info', storageSettings: {} };
            (mockClient.getLogging as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLoggingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getLogging).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getLogging as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetLoggingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getLogging as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetLoggingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getLogging',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
