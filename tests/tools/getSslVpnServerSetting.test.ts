import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSslVpnServerSettingTool } from '../../src/tools/getSslVpnServerSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSslVpnServerSetting', () => {
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
            getSslVpnServerSetting: vi.fn(),
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

    describe('registerGetSslVpnServerSettingTool', () => {
        it('should register the getSslVpnServerSetting tool with correct schema', () => {
            registerGetSslVpnServerSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSslVpnServerSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { enable: true, port: 443, protocol: 'tcp' };
            (mockClient.getSslVpnServerSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSslVpnServerSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getSslVpnServerSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { enable: false };
            (mockClient.getSslVpnServerSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSslVpnServerSettingTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSslVpnServerSetting).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSslVpnServerSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSslVpnServerSettingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSslVpnServerSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
