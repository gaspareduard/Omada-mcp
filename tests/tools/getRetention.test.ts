import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRetentionTool } from '../../src/tools/getRetention.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRetention', () => {
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
            getRetention: vi.fn(),
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

    describe('registerGetRetentionTool', () => {
        it('should register the getRetention tool with correct schema', () => {
            registerGetRetentionTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRetention', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { retentionDays: 30 };
            (mockClient.getRetention as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRetentionTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getRetention).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRetention as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRetentionTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRetention',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
