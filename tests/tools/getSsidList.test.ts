import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSsidListTool } from '../../src/tools/getSsidList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSsidList', () => {
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
            getSsidList: vi.fn(),
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

    describe('registerGetSsidListTool', () => {
        it('should register the getSsidList tool with correct schema', () => {
            registerGetSsidListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSsidList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with wlanId', async () => {
            const mockData = { result: { data: [{ id: 'ssid-1', name: 'Network1' }] } };
            (mockClient.getSsidList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSsidListTool(mockServer, mockClient);
            const result = await toolHandler({ wlanId: 'wlan-123' }, { sessionId: 'test-session' });
            expect(mockClient.getSsidList).toHaveBeenCalledWith('wlan-123', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with wlanId and siteId', async () => {
            const mockData = { result: { data: [{ id: 'ssid-2', name: 'Network2' }] } };
            (mockClient.getSsidList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSsidListTool(mockServer, mockClient);
            const result = await toolHandler({ wlanId: 'wlan-123', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSsidList).toHaveBeenCalledWith('wlan-123', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSsidList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSsidListTool(mockServer, mockClient);
            await expect(toolHandler({ wlanId: 'wlan-123' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSsidList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
