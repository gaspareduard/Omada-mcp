import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSwitchStackDetailTool } from '../../src/tools/getSwitchStackDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSwitchStackDetail', () => {
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
            getSwitchStackDetail: vi.fn(),
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

    describe('registerGetSwitchStackDetailTool', () => {
        it('should register the getSwitchStackDetail tool with correct schema', () => {
            registerGetSwitchStackDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSwitchStackDetail', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required stackId', async () => {
            const mockData = { stackId: 'stack-123', memberCount: 2 };
            (mockClient.getSwitchStackDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSwitchStackDetailTool(mockServer, mockClient);
            const result = await toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' });
            expect(mockClient.getSwitchStackDetail).toHaveBeenCalledWith('stack-123', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with stackId and siteId', async () => {
            const mockData = { stackId: 'stack-456', memberCount: 3 };
            (mockClient.getSwitchStackDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSwitchStackDetailTool(mockServer, mockClient);
            const result = await toolHandler({ stackId: 'stack-456', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSwitchStackDetail).toHaveBeenCalledWith('stack-456', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSwitchStackDetail as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSwitchStackDetailTool(mockServer, mockClient);
            await expect(toolHandler({ stackId: 'stack-123' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSwitchStackDetail',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
