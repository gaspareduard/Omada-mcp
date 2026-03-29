import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetVpnClientStatusTool } from '../../src/tools/getVpnClientStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getVpnClientStatus', () => {
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

    describe('registerGetVpnClientStatusTool', () => {
        it('should register the tool', () => {
            registerGetVpnClientStatusTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getVpnClientStatus', expect.any(Object), expect.any(Function));
        });

        it('should delegate to listClientToSiteVpnClients', async () => {
            const mockData = [{ username: 'user1', status: 'connected' }];
            (mockClient.listClientToSiteVpnClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetVpnClientStatusTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.listClientToSiteVpnClients).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.listClientToSiteVpnClients as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetVpnClientStatusTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.listClientToSiteVpnClients).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.listClientToSiteVpnClients as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetVpnClientStatusTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
