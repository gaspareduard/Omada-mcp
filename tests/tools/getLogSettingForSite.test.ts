import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLogSettingForSiteTool } from '../../src/tools/getLogSettingForSite.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLogSettingForSite', () => {
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
            getLogSettingForSite: vi.fn(),
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

    describe('registerGetLogSettingForSiteTool', () => {
        it('should register the getLogSettingForSite tool with correct schema', () => {
            registerGetLogSettingForSiteTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLogSettingForSite', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { recipients: [], rules: [] };
            (mockClient.getLogSettingForSite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLogSettingForSiteTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getLogSettingForSite).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { recipients: ['admin@example.com'], rules: [] };
            (mockClient.getLogSettingForSite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLogSettingForSiteTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getLogSettingForSite).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getLogSettingForSite as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetLogSettingForSiteTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getLogSettingForSite',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
