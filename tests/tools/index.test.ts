import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerAllTools } from '../../src/tools/index.js';

describe('tools/index', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn(),
        } as unknown as McpServer;

        mockClient = {} as OmadaClient;
    });

    describe('registerAllTools', () => {
        it('should register all tools with the server', () => {
            registerAllTools(mockServer, mockClient);

            // Verify registerTool was called for each tool
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSites', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listDevices', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listClients', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDevice', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSwitchStackDetail', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getClient', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('searchDevices', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listDevicesStats', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listMostActiveClients', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listClientsActivity', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listClientsPastConnections', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getThreatList', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getInternetInfo', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPortForwardingStatus', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLanNetworkList', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLanProfileList', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWlanGroupList', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSsidList', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSsidDetail', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getFirewallSetting', expect.any(Object), expect.any(Function));

            // Verify total number of tools registered
            expect(mockServer.registerTool).toHaveBeenCalledTimes(20);
        });
    });
});
