import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListClientsActivityTool } from '../../src/tools/listClientsActivity.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listClientsActivity', () => {
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
            listClientsActivity: vi.fn(),
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

    describe('registerListClientsActivityTool', () => {
        it('should register the listClientsActivity tool with correct schema', () => {
            registerListClientsActivityTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listClientsActivity', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ timestamp: 1682000000, newClients: 5, activeClients: 20 }];
            (mockClient.listClientsActivity as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListClientsActivityTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listClientsActivity).toHaveBeenCalledWith({ siteId: undefined, start: undefined, end: undefined }, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with all optional args', async () => {
            const mockData = [{ timestamp: 1682000000, newClients: 3, activeClients: 15 }];
            (mockClient.listClientsActivity as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListClientsActivityTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site', start: 1682000000, end: 1682086400 }, { sessionId: 'test-session' });

            expect(mockClient.listClientsActivity).toHaveBeenCalledWith({ siteId: 'test-site', start: 1682000000, end: 1682086400 }, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listClientsActivity as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListClientsActivityTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listClientsActivity',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
