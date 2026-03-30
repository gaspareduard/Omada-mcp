import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSitesDeviceWhiteListTool } from '../../src/tools/getSitesDeviceWhiteList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSitesDeviceWhiteList', () => {
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
            getSitesDeviceWhiteList: vi.fn(),
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

    describe('registerGetSitesDeviceWhiteListTool', () => {
        it('should register with correct name', () => {
            registerGetSitesDeviceWhiteListTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesDeviceWhiteList', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { data: [{ mac: 'AA-BB-CC-DD-EE-FF', name: 'Device' }] };
            (mockClient.getSitesDeviceWhiteList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetSitesDeviceWhiteListTool(mockServer, mockClient);

            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' });

            expect(mockClient.getSitesDeviceWhiteList).toHaveBeenCalledWith(undefined, 1, 10, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.getSitesDeviceWhiteList as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetSitesDeviceWhiteListTool(mockServer, mockClient);

            await toolHandler({ siteId: 'site-1', page: 2, pageSize: 20 }, {});

            expect(mockClient.getSitesDeviceWhiteList).toHaveBeenCalledWith('site-1', 2, 20, undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getSitesDeviceWhiteList as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetSitesDeviceWhiteListTool(mockServer, mockClient);

            const result = await toolHandler({}, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSitesDeviceWhiteList as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetSitesDeviceWhiteListTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
