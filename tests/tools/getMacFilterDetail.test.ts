import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetMacFilterDetailTool } from '../../src/tools/getMacFilterDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getMacFilterDetail', () => {
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
            getMacFilteringGeneralSetting: vi.fn(),
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

    describe('registerGetMacFilterDetailTool', () => {
        it('should register the tool', () => {
            registerGetMacFilterDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getMacFilterDetail', expect.any(Object), expect.any(Function));
        });

        it('should delegate to getMacFilteringGeneralSetting', async () => {
            const mockData = { enabled: true };
            (mockClient.getMacFilteringGeneralSetting as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetMacFilterDetailTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getMacFilteringGeneralSetting).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getMacFilteringGeneralSetting as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetMacFilterDetailTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getMacFilteringGeneralSetting).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getMacFilteringGeneralSetting as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetMacFilterDetailTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
