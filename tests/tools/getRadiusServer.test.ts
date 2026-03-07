import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRadiusServerTool } from '../../src/tools/getRadiusServer.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRadiusServer', () => {
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
            getRadiusServer: vi.fn(),
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

    describe('registerGetRadiusServerTool', () => {
        it('should register the getRadiusServer tool with correct schema', () => {
            registerGetRadiusServerTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRadiusServer', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { host: '192.168.1.100', port: 1812, enabled: true };
            (mockClient.getRadiusServer as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadiusServerTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getRadiusServer).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getRadiusServer as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetRadiusServerTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRadiusServer as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRadiusServerTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getRadiusServer',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
