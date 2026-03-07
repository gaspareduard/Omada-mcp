import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetControllerStatusTool } from '../../src/tools/getControllerStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getControllerStatus', () => {
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
            getControllerStatus: vi.fn(),
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

    describe('registerGetControllerStatusTool', () => {
        it('should register the getControllerStatus tool with correct schema', () => {
            registerGetControllerStatusTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getControllerStatus', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { running: true, uptime: 12345 };
            (mockClient.getControllerStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetControllerStatusTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getControllerStatus).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getControllerStatus as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetControllerStatusTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getControllerStatus',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
