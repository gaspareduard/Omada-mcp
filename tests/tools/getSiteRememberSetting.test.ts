import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteRememberSettingTool } from '../../src/tools/getSiteRememberSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteRememberSetting', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteRememberSetting: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteRememberSettingTool', () => {
        it('should register the tool', () => {
            registerGetSiteRememberSettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteRememberSetting', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteRememberSetting with no args', async () => {
            const mockData = { id: 'setting-1' };
            (mockClient.getSiteRememberSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteRememberSettingTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getSiteRememberSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getSiteRememberSetting as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetSiteRememberSettingTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getSiteRememberSetting).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getSiteRememberSetting as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteRememberSettingTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
