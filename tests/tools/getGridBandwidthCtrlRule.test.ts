import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridBandwidthCtrlRuleTool } from '../../src/tools/getGridBandwidthCtrlRule.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridBandwidthCtrlRule', () => {
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
            getGridBandwidthCtrlRule: vi.fn(),
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

    describe('registerGetGridBandwidthCtrlRuleTool', () => {
        it('should register the getGridBandwidthCtrlRule tool with correct schema', () => {
            registerGetGridBandwidthCtrlRuleTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridBandwidthCtrlRule', expect.any(Object), expect.any(Function));
        });

        it('should successfully get bandwidth control rules with defaults', async () => {
            const mockData = { data: [{ id: '1', uploadLimit: 100, downloadLimit: 200 }], totalRows: 1 };

            (mockClient.getGridBandwidthCtrlRule as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridBandwidthCtrlRuleTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridBandwidthCtrlRule).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination and siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridBandwidthCtrlRule as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridBandwidthCtrlRuleTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 20, siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridBandwidthCtrlRule).toHaveBeenCalledWith(2, 20, 'test-site', undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridBandwidthCtrlRule as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridBandwidthCtrlRuleTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridBandwidthCtrlRule).toHaveBeenCalledWith(undefined, undefined, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridBandwidthCtrlRule as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridBandwidthCtrlRuleTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridBandwidthCtrlRule',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
