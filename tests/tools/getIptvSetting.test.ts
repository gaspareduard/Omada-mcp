import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetIptvSettingTool } from '../../src/tools/getIptvSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getIptvSetting', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getIptvSetting: vi.fn() } as unknown as OmadaClient;
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

    it('should register the tool', () => {
        registerGetIptvSettingTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getIptvSetting', expect.any(Object), expect.any(Function));
    });

    it('should execute with no args', async () => {
        const mockData = { result: true };
        (mockClient.getIptvSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetIptvSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, { sessionId: 'test' });
        expect(mockClient.getIptvSetting).toHaveBeenCalledWith(undefined, undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should pass siteId', async () => {
        (mockClient.getIptvSetting as ReturnType<typeof vi.fn>).mockResolvedValue({});
        registerGetIptvSettingTool(mockServer, mockClient);
        await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
        expect(mockClient.getIptvSetting).toHaveBeenCalledWith('site-1', undefined);
    });

    it('should handle errors', async () => {
        (mockClient.getIptvSetting as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetIptvSettingTool(mockServer, mockClient);
        await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
