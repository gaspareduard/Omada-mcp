import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDashboardMostActiveEapsTool } from '../../src/tools/getDashboardMostActiveEaps.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDashboardMostActiveEaps', () => {
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
            getDashboardMostActiveEaps: vi.fn(),
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

    describe('registerGetDashboardMostActiveEapsTool', () => {
        it('should register the getDashboardMostActiveEaps tool with correct schema', () => {
            registerGetDashboardMostActiveEapsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardMostActiveEaps', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF', traffic: 1000 }];
            (mockClient.getDashboardMostActiveEaps as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardMostActiveEapsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getDashboardMostActiveEaps).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF' }];
            (mockClient.getDashboardMostActiveEaps as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDashboardMostActiveEapsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDashboardMostActiveEaps).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDashboardMostActiveEaps as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDashboardMostActiveEapsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDashboardMostActiveEaps',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
