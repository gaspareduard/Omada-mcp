import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDashboardWifiSummaryTool } from '../../src/tools/getDashboardWifiSummary.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDashboardWifiSummary', () => {
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
            getDashboardWifiSummary: vi.fn(),
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

    describe('registerGetDashboardWifiSummaryTool', () => {
        it('should register the getDashboardWifiSummary tool with correct schema', () => {
            registerGetDashboardWifiSummaryTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardWifiSummary', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { totalAps: 10, connectedAps: 8, wirelessClients: 42 };
            (mockClient.getDashboardWifiSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardWifiSummaryTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDashboardWifiSummary).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { totalAps: 10 };
            (mockClient.getDashboardWifiSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardWifiSummaryTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDashboardWifiSummary).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDashboardWifiSummary as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDashboardWifiSummaryTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDashboardWifiSummary',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
