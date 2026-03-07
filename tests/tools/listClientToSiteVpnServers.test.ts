import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListClientToSiteVpnServersTool } from '../../src/tools/listClientToSiteVpnServers.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listClientToSiteVpnServers', () => {
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
            listClientToSiteVpnServers: vi.fn(),
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

    describe('registerListClientToSiteVpnServersTool', () => {
        it('should register the listClientToSiteVpnServers tool with correct schema', () => {
            registerListClientToSiteVpnServersTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listClientToSiteVpnServers', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ id: 'server-1', type: 'openvpn', ip: '10.0.0.1' }];
            (mockClient.listClientToSiteVpnServers as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListClientToSiteVpnServersTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listClientToSiteVpnServers).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = [{ id: 'server-2', type: 'l2tp', ip: '192.168.1.1' }];
            (mockClient.listClientToSiteVpnServers as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListClientToSiteVpnServersTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listClientToSiteVpnServers).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listClientToSiteVpnServers as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListClientToSiteVpnServersTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listClientToSiteVpnServers',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
