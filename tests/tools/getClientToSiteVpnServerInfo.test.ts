import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientToSiteVpnServerInfoTool } from '../../src/tools/getClientToSiteVpnServerInfo.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getClientToSiteVpnServerInfo', () => {
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
            getClientToSiteVpnServerInfo: vi.fn(),
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

    describe('registerGetClientToSiteVpnServerInfoTool', () => {
        it('should register the getClientToSiteVpnServerInfo tool with correct schema', () => {
            registerGetClientToSiteVpnServerInfoTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getClientToSiteVpnServerInfo', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with vpnId', async () => {
            const mockData = { id: 'vpn-1', protocol: 'OpenVPN' };
            (mockClient.getClientToSiteVpnServerInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientToSiteVpnServerInfoTool(mockServer, mockClient);

            const result = await toolHandler({ vpnId: 'vpn-1' }, { sessionId: 'test-session' });

            expect(mockClient.getClientToSiteVpnServerInfo).toHaveBeenCalledWith('vpn-1', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { id: 'vpn-1' };
            (mockClient.getClientToSiteVpnServerInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientToSiteVpnServerInfoTool(mockServer, mockClient);

            await toolHandler({ vpnId: 'vpn-1', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getClientToSiteVpnServerInfo).toHaveBeenCalledWith('vpn-1', 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getClientToSiteVpnServerInfo as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetClientToSiteVpnServerInfoTool(mockServer, mockClient);

            await expect(toolHandler({ vpnId: 'vpn-1' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getClientToSiteVpnServerInfo',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
