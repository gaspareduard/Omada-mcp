import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLogSettingForSiteV2Tool } from '../../src/tools/getLogSettingForSiteV2.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLogSettingForSiteV2', () => {
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
            getLogSettingForSiteV2: vi.fn(),
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

    describe('registerGetLogSettingForSiteV2Tool', () => {
        it('should register the getLogSettingForSiteV2 tool with correct schema', () => {
            registerGetLogSettingForSiteV2Tool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLogSettingForSiteV2', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { logLevel: 'info', notifications: [] };
            (mockClient.getLogSettingForSiteV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLogSettingForSiteV2Tool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getLogSettingForSiteV2).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { logLevel: 'warn' };
            (mockClient.getLogSettingForSiteV2 as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLogSettingForSiteV2Tool(mockServer, mockClient);
            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getLogSettingForSiteV2).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getLogSettingForSiteV2 as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetLogSettingForSiteV2Tool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getLogSettingForSiteV2 as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetLogSettingForSiteV2Tool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getLogSettingForSiteV2',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
