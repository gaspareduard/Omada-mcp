import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetTrafficPriorityTool } from '../../src/tools/getTrafficPriority.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getTrafficPriority', () => {
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
            getTrafficPriority: vi.fn(),
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

    describe('registerGetTrafficPriorityTool', () => {
        it('should register the tool', () => {
            registerGetTrafficPriorityTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getTrafficPriority', expect.any(Object), expect.any(Function));
        });

        it('should execute and return result', async () => {
            const mockData = { voipEnabled: true };
            (mockClient.getTrafficPriority as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetTrafficPriorityTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getTrafficPriority).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getTrafficPriority as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetTrafficPriorityTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getTrafficPriority).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getTrafficPriority as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetTrafficPriorityTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
