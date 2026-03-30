import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSsidDetailTool } from '../../src/tools/getSsidDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSsidDetail', () => {
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
            getSsidDetail: vi.fn(),
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

    describe('registerGetSsidDetailTool', () => {
        it('should register the getSsidDetail tool with correct schema', () => {
            registerGetSsidDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSsidDetail', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with wlanId and ssidId', async () => {
            const mockData = { name: 'MySSID', security: 'WPA2' };
            (mockClient.getSsidDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSsidDetailTool(mockServer, mockClient);
            const result = await toolHandler({ wlanId: 'wlan-123', ssidId: 'ssid-456' }, { sessionId: 'test-session' });
            expect(mockClient.getSsidDetail).toHaveBeenCalledWith('wlan-123', 'ssid-456', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with wlanId, ssidId, and siteId', async () => {
            const mockData = { name: 'MySSID2', security: 'WPA3' };
            (mockClient.getSsidDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSsidDetailTool(mockServer, mockClient);
            const result = await toolHandler({ wlanId: 'wlan-123', ssidId: 'ssid-456', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSsidDetail).toHaveBeenCalledWith('wlan-123', 'ssid-456', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSsidDetail as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSsidDetailTool(mockServer, mockClient);
            await expect(toolHandler({ wlanId: 'wlan-123', ssidId: 'ssid-456' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSsidDetail',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
