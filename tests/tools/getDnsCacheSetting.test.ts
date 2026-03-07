import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDnsCacheSettingTool } from '../../src/tools/getDnsCacheSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDnsCacheSetting', () => {
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
            getDnsCacheSetting: vi.fn(),
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

    describe('registerGetDnsCacheSettingTool', () => {
        it('should register the getDnsCacheSetting tool with correct schema', () => {
            registerGetDnsCacheSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDnsCacheSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { enabled: true, ttl: 300 };
            (mockClient.getDnsCacheSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDnsCacheSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDnsCacheSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: false };
            (mockClient.getDnsCacheSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDnsCacheSettingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDnsCacheSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDnsCacheSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDnsCacheSettingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDnsCacheSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
