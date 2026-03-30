import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetIpMacBindingGeneralSettingTool } from '../../src/tools/getIpMacBindingGeneralSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getIpMacBindingGeneralSetting', () => {
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
            getIpMacBindingGeneralSetting: vi.fn(),
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

    describe('registerGetIpMacBindingGeneralSettingTool', () => {
        it('should register the getIpMacBindingGeneralSetting tool with correct schema', () => {
            registerGetIpMacBindingGeneralSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getIpMacBindingGeneralSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { enabled: true };
            (mockClient.getIpMacBindingGeneralSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetIpMacBindingGeneralSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getIpMacBindingGeneralSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { enabled: false };
            (mockClient.getIpMacBindingGeneralSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetIpMacBindingGeneralSettingTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getIpMacBindingGeneralSetting).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getIpMacBindingGeneralSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetIpMacBindingGeneralSettingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getIpMacBindingGeneralSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
