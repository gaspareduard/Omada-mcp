import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUpgradeLogsTool } from '../../src/tools/getUpgradeLogs.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUpgradeLogs', () => {
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
            getUpgradeLogs: vi.fn(),
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

    describe('registerGetUpgradeLogsTool', () => {
        it('should register the getUpgradeLogs tool with correct schema', () => {
            registerGetUpgradeLogsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getUpgradeLogs', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with default pagination', async () => {
            const mockData = { data: [] };
            (mockClient.getUpgradeLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUpgradeLogsTool(mockServer, mockClient);

            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' });

            expect(mockClient.getUpgradeLogs).toHaveBeenCalledWith(1, 10, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute with custom pagination', async () => {
            const mockData = { data: [] };
            (mockClient.getUpgradeLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUpgradeLogsTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 50 }, { sessionId: 'test-session' });

            expect(mockClient.getUpgradeLogs).toHaveBeenCalledWith(2, 50, undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getUpgradeLogs as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetUpgradeLogsTool(mockServer, mockClient);

            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getUpgradeLogs as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetUpgradeLogsTool(mockServer, mockClient);

            await expect(toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getUpgradeLogs',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
