import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListClientToSiteVpnClientsTool } from '../../src/tools/listClientToSiteVpnClients.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listClientToSiteVpnClients', () => {
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
            listClientToSiteVpnClients: vi.fn(),
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

    describe('registerListClientToSiteVpnClientsTool', () => {
        it('should register the listClientToSiteVpnClients tool with correct schema', () => {
            registerListClientToSiteVpnClientsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listClientToSiteVpnClients', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ id: 'client-1', username: 'user1' }];
            (mockClient.listClientToSiteVpnClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListClientToSiteVpnClientsTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listClientToSiteVpnClients).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = [{ id: 'client-2', username: 'user2' }];
            (mockClient.listClientToSiteVpnClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListClientToSiteVpnClientsTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listClientToSiteVpnClients).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listClientToSiteVpnClients as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListClientToSiteVpnClientsTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listClientToSiteVpnClients',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
