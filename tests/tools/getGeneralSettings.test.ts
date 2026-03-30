import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGeneralSettingsTool } from '../../src/tools/getGeneralSettings.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGeneralSettings', () => {
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
            getGeneralSettings: vi.fn(),
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

    describe('registerGetGeneralSettingsTool', () => {
        it('should register the getGeneralSettings tool with correct schema', () => {
            registerGetGeneralSettingsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGeneralSettings', expect.any(Object), expect.any(Function));
        });

        it('should successfully get general settings', async () => {
            const mockData = { controllerName: 'Omada Controller', language: 'en', discoveryEnabled: true };

            (mockClient.getGeneralSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGeneralSettingsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGeneralSettings).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle undefined response', async () => {
            (mockClient.getGeneralSettings as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetGeneralSettingsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGeneralSettings as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGeneralSettingsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGeneralSettings',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
