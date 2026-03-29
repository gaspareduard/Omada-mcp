import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetVpnUserDetailTool } from '../../src/tools/getVpnUserDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getVpnUserDetail', () => {
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
            getVpnUserDetail: vi.fn(),
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

    describe('registerGetVpnUserDetailTool', () => {
        it('should register the tool', () => {
            registerGetVpnUserDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getVpnUserDetail', expect.any(Object), expect.any(Function));
        });

        it('should call getVpnUserDetail with vpnId', async () => {
            const mockData = { users: [] };
            (mockClient.getVpnUserDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetVpnUserDetailTool(mockServer, mockClient);
            const result = await toolHandler({ vpnId: 'vpn-1' }, { sessionId: 'test' });
            expect(mockClient.getVpnUserDetail).toHaveBeenCalledWith('vpn-1', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getVpnUserDetail as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetVpnUserDetailTool(mockServer, mockClient);
            await toolHandler({ vpnId: 'vpn-1', siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getVpnUserDetail).toHaveBeenCalledWith('vpn-1', 'site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getVpnUserDetail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetVpnUserDetailTool(mockServer, mockClient);
            await expect(toolHandler({ vpnId: 'vpn-1' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
