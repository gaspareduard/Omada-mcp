import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSwitchDot1xSettingTool } from '../../src/tools/getSwitchDot1xSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSwitchDot1xSetting', () => {
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
            getSwitchDot1xSetting: vi.fn(),
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

    describe('registerGetSwitchDot1xSettingTool', () => {
        it('should register the getSwitchDot1xSetting tool with correct schema', () => {
            registerGetSwitchDot1xSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSwitchDot1xSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { enable: true, mode: 'portBased' };
            (mockClient.getSwitchDot1xSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSwitchDot1xSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getSwitchDot1xSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { enable: false };
            (mockClient.getSwitchDot1xSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSwitchDot1xSettingTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSwitchDot1xSetting).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSwitchDot1xSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSwitchDot1xSettingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSwitchDot1xSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
