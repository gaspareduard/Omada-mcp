import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDashboardTopCpuUsageTool } from '../../src/tools/getDashboardTopCpuUsage.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDashboardTopCpuUsage', () => {
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
            getDashboardTopCpuUsage: vi.fn(),
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

    describe('registerGetDashboardTopCpuUsageTool', () => {
        it('should register the getDashboardTopCpuUsage tool with correct schema', () => {
            registerGetDashboardTopCpuUsageTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardTopCpuUsage', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF', cpuUsage: 75 }];
            (mockClient.getDashboardTopCpuUsage as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardTopCpuUsageTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDashboardTopCpuUsage).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF' }];
            (mockClient.getDashboardTopCpuUsage as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardTopCpuUsageTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDashboardTopCpuUsage).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDashboardTopCpuUsage as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDashboardTopCpuUsageTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDashboardTopCpuUsage',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
