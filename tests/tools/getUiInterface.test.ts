import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUiInterfaceTool } from '../../src/tools/getUiInterface.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUiInterface', () => {
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
            getUiInterface: vi.fn(),
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

    describe('registerGetUiInterfaceTool', () => {
        it('should register the getUiInterface tool with correct schema', () => {
            registerGetUiInterfaceTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUiInterface', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { timeout: 30, sessionTimeout: 3600 };
            (mockClient.getUiInterface as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUiInterfaceTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getUiInterface).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getUiInterface as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetUiInterfaceTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getUiInterface',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
