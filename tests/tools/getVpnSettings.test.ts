import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetVpnSettingsTool } from '../../src/tools/getVpnSettings.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getVpnSettings', () => {
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
            getVpnSettings: vi.fn(),
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

    describe('registerGetVpnSettingsTool', () => {
        it('should register the getVpnSettings tool with correct schema', () => {
            registerGetVpnSettingsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getVpnSettings', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { ipsecEnabled: true, openVpnEnabled: false };
            (mockClient.getVpnSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetVpnSettingsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getVpnSettings).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { ipsecEnabled: false, openVpnEnabled: true };
            (mockClient.getVpnSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetVpnSettingsTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getVpnSettings).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getVpnSettings as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetVpnSettingsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getVpnSettings',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
