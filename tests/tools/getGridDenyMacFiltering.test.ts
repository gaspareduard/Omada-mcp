import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGridDenyMacFilteringTool } from '../../src/tools/getGridDenyMacFiltering.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGridDenyMacFiltering', () => {
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
            getGridDenyMacFiltering: vi.fn(),
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

    describe('registerGetGridDenyMacFilteringTool', () => {
        it('should register the getGridDenyMacFiltering tool with correct schema', () => {
            registerGetGridDenyMacFilteringTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridDenyMacFiltering', expect.any(Object), expect.any(Function));
        });

        it('should successfully get MAC deny-list with defaults', async () => {
            const mockData = { data: [{ mac: 'AA-BB-CC-DD-EE-FF', name: 'Blocked Device' }], totalRows: 1 };

            (mockClient.getGridDenyMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDenyMacFilteringTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getGridDenyMacFiltering).toHaveBeenCalledWith(1, 10, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass pagination params when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridDenyMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDenyMacFilteringTool(mockServer, mockClient);

            await toolHandler({ page: 3, pageSize: 50 }, { sessionId: 'test-session' });

            expect(mockClient.getGridDenyMacFiltering).toHaveBeenCalledWith(3, 50, undefined, undefined);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { data: [], totalRows: 0 };

            (mockClient.getGridDenyMacFiltering as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetGridDenyMacFilteringTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getGridDenyMacFiltering).toHaveBeenCalledWith(1, 10, 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getGridDenyMacFiltering as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetGridDenyMacFilteringTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getGridDenyMacFiltering',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
