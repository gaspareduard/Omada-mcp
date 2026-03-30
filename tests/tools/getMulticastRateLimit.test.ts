import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetMulticastRateLimitTool } from '../../src/tools/getMulticastRateLimit.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getMulticastRateLimit', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getMulticastRateLimit: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetMulticastRateLimitTool', () => {
        it('should register the tool', () => {
            registerGetMulticastRateLimitTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getMulticastRateLimit', expect.any(Object), expect.any(Function));
        });

        it('should call getMulticastRateLimit with no args', async () => {
            const mockData = { id: 'mcast-1' };
            (mockClient.getMulticastRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetMulticastRateLimitTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getMulticastRateLimit).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getMulticastRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetMulticastRateLimitTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getMulticastRateLimit).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getMulticastRateLimit as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetMulticastRateLimitTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
