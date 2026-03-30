import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetMacFilteringGeneralSettingTool } from '../../src/tools/getMacFilteringGeneralSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getMacFilteringGeneralSetting', () => {
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
            getMacFilteringGeneralSetting: vi.fn(),
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

    describe('registerGetMacFilteringGeneralSettingTool', () => {
        it('should register the getMacFilteringGeneralSetting tool with correct schema', () => {
            registerGetMacFilteringGeneralSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getMacFilteringGeneralSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { enabled: true, filterMode: 'deny' };
            (mockClient.getMacFilteringGeneralSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetMacFilteringGeneralSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getMacFilteringGeneralSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: false };
            (mockClient.getMacFilteringGeneralSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetMacFilteringGeneralSettingTool(mockServer, mockClient);
            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getMacFilteringGeneralSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getMacFilteringGeneralSetting as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetMacFilteringGeneralSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getMacFilteringGeneralSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetMacFilteringGeneralSettingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getMacFilteringGeneralSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
