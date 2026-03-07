import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDashboardTopMemoryUsageTool } from '../../src/tools/getDashboardTopMemoryUsage.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDashboardTopMemoryUsage', () => {
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
            getDashboardTopMemoryUsage: vi.fn(),
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

    describe('registerGetDashboardTopMemoryUsageTool', () => {
        it('should register the getDashboardTopMemoryUsage tool with correct schema', () => {
            registerGetDashboardTopMemoryUsageTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardTopMemoryUsage', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF', memUsage: 80 }];
            (mockClient.getDashboardTopMemoryUsage as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardTopMemoryUsageTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDashboardTopMemoryUsage).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF' }];
            (mockClient.getDashboardTopMemoryUsage as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardTopMemoryUsageTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDashboardTopMemoryUsage).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDashboardTopMemoryUsage as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDashboardTopMemoryUsageTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDashboardTopMemoryUsage',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
