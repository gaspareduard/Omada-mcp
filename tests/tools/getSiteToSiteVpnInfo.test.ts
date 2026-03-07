import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteToSiteVpnInfoTool } from '../../src/tools/getSiteToSiteVpnInfo.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteToSiteVpnInfo', () => {
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
            getSiteToSiteVpnInfo: vi.fn(),
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

    describe('registerGetSiteToSiteVpnInfoTool', () => {
        it('should register the getSiteToSiteVpnInfo tool with correct schema', () => {
            registerGetSiteToSiteVpnInfoTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteToSiteVpnInfo', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with vpnId', async () => {
            const mockData = { vpnId: 'vpn-123', type: 'ipsec' };
            (mockClient.getSiteToSiteVpnInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteToSiteVpnInfoTool(mockServer, mockClient);
            const result = await toolHandler({ vpnId: 'vpn-123' }, { sessionId: 'test-session' });
            expect(mockClient.getSiteToSiteVpnInfo).toHaveBeenCalledWith('vpn-123', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with vpnId and siteId', async () => {
            const mockData = { vpnId: 'vpn-456', type: 'openvpn' };
            (mockClient.getSiteToSiteVpnInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteToSiteVpnInfoTool(mockServer, mockClient);
            const result = await toolHandler({ vpnId: 'vpn-456', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSiteToSiteVpnInfo).toHaveBeenCalledWith('vpn-456', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSiteToSiteVpnInfo as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSiteToSiteVpnInfoTool(mockServer, mockClient);
            await expect(toolHandler({ vpnId: 'vpn-123' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSiteToSiteVpnInfo',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
