import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAdvancedVpnSettingTool } from '../../src/tools/getAdvancedVpnSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAdvancedVpnSetting', () => {
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

    describe('registerGetAdvancedVpnSettingTool', () => {
        it('should register the tool', () => {
            registerGetAdvancedVpnSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getAdvancedVpnSetting', expect.any(Object), expect.any(Function));
        });

        it('should delegate to getVpnSettings', async () => {
            const mockData = { enabled: true };
            (mockClient.getVpnSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetAdvancedVpnSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getVpnSettings).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getVpnSettings as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetAdvancedVpnSettingTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getVpnSettings).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getVpnSettings as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetAdvancedVpnSettingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
