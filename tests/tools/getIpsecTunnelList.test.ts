import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetIpsecTunnelListTool } from '../../src/tools/getIpsecTunnelList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getIpsecTunnelList', () => {
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
            listSiteToSiteVpns: vi.fn(),
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

    describe('registerGetIpsecTunnelListTool', () => {
        it('should register the tool', () => {
            registerGetIpsecTunnelListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getIpsecTunnelList', expect.any(Object), expect.any(Function));
        });

        it('should delegate to listSiteToSiteVpns', async () => {
            const mockData = [{ id: 'vpn-1', name: 'Tunnel 1' }];
            (mockClient.listSiteToSiteVpns as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetIpsecTunnelListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.listSiteToSiteVpns).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.listSiteToSiteVpns as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetIpsecTunnelListTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.listSiteToSiteVpns).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.listSiteToSiteVpns as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetIpsecTunnelListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
