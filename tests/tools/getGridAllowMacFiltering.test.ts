import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridAllowMacFilteringTool } from '../../src/tools/getGridAllowMacFiltering.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridAllowMacFiltering', () => {
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
            getGridAllowMacFiltering: vi.fn(),
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

    describe('registerGetGridAllowMacFilteringTool', () => {
        it('should register the getGridAllowMacFiltering tool with correct schema', () => {
            registerGetGridAllowMacFilteringTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridAllowMacFiltering', expect.any(Object), expect.any(Function));
        });

        it('should successfully get MAC allow-list with defaults', async () => {
            const mockData = { data: [{ mac: 'AA-BB-CC-DD-EE-FF', name: 'Device 1' }], totalRows: 1 };

            (mockClient.getGridAllowMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridAllowMacFilteringTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridAllowMacFiltering).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination params when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridAllowMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridAllowMacFilteringTool(mockServer, mockClient);

            await toolHandler({ page: 2, pageSize: 25 }, { sessionId: 'test-session' });

            expect(mockClient.getGridAllowMacFiltering).toHaveBeenCalledWith(2, 25, undefined, undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridAllowMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridAllowMacFilteringTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridAllowMacFiltering).toHaveBeenCalledWith(1, 10, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridAllowMacFiltering as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridAllowMacFilteringTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridAllowMacFiltering',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
