import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDashboardSwitchSummaryTool } from '../../src/tools/getDashboardSwitchSummary.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDashboardSwitchSummary', () => {
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
            getDashboardSwitchSummary: vi.fn(),
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

    describe('registerGetDashboardSwitchSummaryTool', () => {
        it('should register the getDashboardSwitchSummary tool with correct schema', () => {
            registerGetDashboardSwitchSummaryTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardSwitchSummary', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { total: 5, activePorts: 24, poeUsed: 60 };
            (mockClient.getDashboardSwitchSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardSwitchSummaryTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDashboardSwitchSummary).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { total: 5 };
            (mockClient.getDashboardSwitchSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardSwitchSummaryTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDashboardSwitchSummary).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDashboardSwitchSummary as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDashboardSwitchSummaryTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDashboardSwitchSummary',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
