import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetFirewallSettingTool } from '../../src/tools/getFirewallSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getFirewallSetting', () => {
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
            getFirewallSetting: vi.fn(),
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

    describe('registerGetFirewallSettingTool', () => {
        it('should register the getFirewallSetting tool with correct schema', () => {
            registerGetFirewallSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getFirewallSetting', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { enabled: true, rules: [] };
            (mockClient.getFirewallSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetFirewallSettingTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getFirewallSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: true };
            (mockClient.getFirewallSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetFirewallSettingTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getFirewallSetting).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getFirewallSetting as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetFirewallSettingTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getFirewallSetting',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
