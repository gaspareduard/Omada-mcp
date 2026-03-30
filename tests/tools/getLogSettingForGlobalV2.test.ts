import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLogSettingForGlobalV2Tool } from '../../src/tools/getLogSettingForGlobalV2.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLogSettingForGlobalV2', () => {
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
            getLogSettingForGlobalV2: vi.fn(),
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

    describe('registerGetLogSettingForGlobalV2Tool', () => {
        it('should register the getLogSettingForGlobalV2 tool with correct schema', () => {
            registerGetLogSettingForGlobalV2Tool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLogSettingForGlobalV2', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { recipients: [], notifications: [], extended: true };
            (mockClient.getLogSettingForGlobalV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLogSettingForGlobalV2Tool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getLogSettingForGlobalV2).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getLogSettingForGlobalV2 as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetLogSettingForGlobalV2Tool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getLogSettingForGlobalV2',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
