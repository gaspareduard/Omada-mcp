import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetTrafficStatsTool } from '../../src/tools/getTrafficStats.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getTrafficStats', () => {
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
            getWanUsageStats: vi.fn(),
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

    describe('registerGetTrafficStatsTool', () => {
        it('should register the tool', () => {
            registerGetTrafficStatsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getTrafficStats', expect.any(Object), expect.any(Function));
        });

        it('should delegate to getWanUsageStats', async () => {
            const mockData = { upload: 1000, download: 5000 };
            (mockClient.getWanUsageStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetTrafficStatsTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getWanUsageStats).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getWanUsageStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetTrafficStatsTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getWanUsageStats).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getWanUsageStats as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetTrafficStatsTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
