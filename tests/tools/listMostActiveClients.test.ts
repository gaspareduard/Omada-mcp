import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListMostActiveClientsTool } from '../../src/tools/listMostActiveClients.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listMostActiveClients', () => {
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
            listMostActiveClients: vi.fn(),
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

    describe('registerListMostActiveClientsTool', () => {
        it('should register the listMostActiveClients tool with correct schema', () => {
            registerListMostActiveClientsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listMostActiveClients', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ mac: 'AA:BB:CC:DD:EE:FF', name: 'laptop', traffic: 1024 }];
            (mockClient.listMostActiveClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListMostActiveClientsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listMostActiveClients).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ mac: 'AA:BB:CC:DD:EE:FF', name: 'laptop', traffic: 1024 }];
            (mockClient.listMostActiveClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListMostActiveClientsTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listMostActiveClients).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listMostActiveClients as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListMostActiveClientsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listMostActiveClients',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
