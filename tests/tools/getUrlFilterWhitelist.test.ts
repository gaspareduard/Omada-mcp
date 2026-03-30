import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUrlFilterWhitelistTool } from '../../src/tools/getUrlFilterWhitelist.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUrlFilterWhitelist', () => {
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
            getGridAllowMacFiltering: vi.fn(),
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

    describe('registerGetUrlFilterWhitelistTool', () => {
        it('should register the tool', () => {
            registerGetUrlFilterWhitelistTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUrlFilterWhitelist', expect.any(Object), expect.any(Function));
        });

        it('should delegate to getGridAllowMacFiltering', async () => {
            const mockData = { data: [] };
            (mockClient.getGridAllowMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetUrlFilterWhitelistTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' });
            expect(mockClient.getGridAllowMacFiltering).toHaveBeenCalledWith(1, 10, undefined, undefined);
        });

        it('should pass siteId', async () => {
            (mockClient.getGridAllowMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetUrlFilterWhitelistTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 10, siteId: 'site-x' }, { sessionId: 'test' });
            expect(mockClient.getGridAllowMacFiltering).toHaveBeenCalledWith(1, 10, 'site-x', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getGridAllowMacFiltering as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetUrlFilterWhitelistTool(mockServer, mockClient);
            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
