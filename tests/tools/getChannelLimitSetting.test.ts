import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetChannelLimitSettingTool } from '../../src/tools/getChannelLimitSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getChannelLimitSetting', () => {
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
            getChannelLimitSetting: vi.fn(),
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

    describe('registerGetChannelLimitSettingTool', () => {
        it('should register the getChannelLimitSetting tool with correct schema', () => {
            registerGetChannelLimitSettingTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getChannelLimitSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { allowedChannels2g: [1, 6, 11], allowedChannels5g: [36, 40, 44] };
            (mockClient.getChannelLimitSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetChannelLimitSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getChannelLimitSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { allowedChannels2g: [1, 6, 11] };
            (mockClient.getChannelLimitSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetChannelLimitSettingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getChannelLimitSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getChannelLimitSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetChannelLimitSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getChannelLimitSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetChannelLimitSettingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getChannelLimitSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
