import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDeviceAccessManagementTool } from '../../src/tools/getDeviceAccessManagement.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDeviceAccessManagement', () => {
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
            getDeviceAccessManagement: vi.fn(),
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

    describe('registerGetDeviceAccessManagementTool', () => {
        it('should register the getDeviceAccessManagement tool with correct schema', () => {
            registerGetDeviceAccessManagementTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDeviceAccessManagement', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { enabled: true, allowList: [] };
            (mockClient.getDeviceAccessManagement as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDeviceAccessManagementTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDeviceAccessManagement).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDeviceAccessManagement as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDeviceAccessManagementTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDeviceAccessManagement',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
