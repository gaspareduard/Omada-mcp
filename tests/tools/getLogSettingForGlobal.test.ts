import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLogSettingForGlobalTool } from '../../src/tools/getLogSettingForGlobal.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLogSettingForGlobal', () => {
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
            getLogSettingForGlobal: vi.fn(),
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

    describe('registerGetLogSettingForGlobalTool', () => {
        it('should register the getLogSettingForGlobal tool with correct schema', () => {
            registerGetLogSettingForGlobalTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLogSettingForGlobal', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { recipients: [], notifications: [] };
            (mockClient.getLogSettingForGlobal as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLogSettingForGlobalTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getLogSettingForGlobal).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getLogSettingForGlobal as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetLogSettingForGlobalTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getLogSettingForGlobal',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
