import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetWebhookLogsForGlobalTool } from '../../src/tools/getWebhookLogsForGlobal.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getWebhookLogsForGlobal', () => {
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
            getWebhookLogsForGlobal: vi.fn(),
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

    describe('registerGetWebhookLogsForGlobalTool', () => {
        it('should register the getWebhookLogsForGlobal tool with correct schema', () => {
            registerGetWebhookLogsForGlobalTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWebhookLogsForGlobal', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { totalRows: 2, data: [{ id: 'log-1', status: 'success' }] };
            (mockClient.getWebhookLogsForGlobal as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWebhookLogsForGlobalTool(mockServer, mockClient);

            const result = await toolHandler(
                { webhookId: 'webhook-1', timeStart: 1679297710438, timeEnd: 1681889710438 },
                { sessionId: 'test-session' }
            );

            expect(mockClient.getWebhookLogsForGlobal).toHaveBeenCalledWith(1, 10, 'webhook-1', 1679297710438, 1681889710438, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with custom pagination', async () => {
            const mockData = { totalRows: 5, data: [] };
            (mockClient.getWebhookLogsForGlobal as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWebhookLogsForGlobalTool(mockServer, mockClient);

            const result = await toolHandler(
                { page: 2, pageSize: 20, webhookId: 'webhook-2', timeStart: 1679297710438, timeEnd: 1681889710438 },
                { sessionId: 'test-session' }
            );

            expect(mockClient.getWebhookLogsForGlobal).toHaveBeenCalledWith(2, 20, 'webhook-2', 1679297710438, 1681889710438, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getWebhookLogsForGlobal as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetWebhookLogsForGlobalTool(mockServer, mockClient);

            await expect(
                toolHandler({ webhookId: 'webhook-1', timeStart: 1679297710438, timeEnd: 1681889710438 }, { sessionId: 'test-session' })
            ).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getWebhookLogsForGlobal',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
