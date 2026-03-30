import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetWlanGroupListTool } from '../../src/tools/getWlanGroupList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getWlanGroupList', () => {
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
            getWlanGroupList: vi.fn(),
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

    describe('registerGetWlanGroupListTool', () => {
        it('should register the getWlanGroupList tool with correct schema', () => {
            registerGetWlanGroupListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWlanGroupList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ id: 'wlan-1', name: 'Default WLAN' }];
            (mockClient.getWlanGroupList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWlanGroupListTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getWlanGroupList).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = [{ id: 'wlan-2', name: 'Guest WLAN' }];
            (mockClient.getWlanGroupList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWlanGroupListTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getWlanGroupList).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getWlanGroupList as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetWlanGroupListTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getWlanGroupList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
