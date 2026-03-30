import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetWireguardSummaryTool } from '../../src/tools/getWireguardSummary.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getWireguardSummary', () => {
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
            getWireguardSummary: vi.fn(),
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

    describe('registerGetWireguardSummaryTool', () => {
        it('should register the getWireguardSummary tool with correct schema', () => {
            registerGetWireguardSummaryTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWireguardSummary', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ id: 'wg-1', name: 'WireGuard 1' }];
            (mockClient.getWireguardSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWireguardSummaryTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getWireguardSummary).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = [{ id: 'wg-2', name: 'WireGuard 2' }];
            (mockClient.getWireguardSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWireguardSummaryTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getWireguardSummary).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getWireguardSummary as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetWireguardSummaryTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getWireguardSummary',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
