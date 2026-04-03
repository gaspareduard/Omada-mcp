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
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRateLimitProfiles', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setClientRateLimit', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setClientRateLimitProfile', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('disableClientRateLimit', expect.any(Object), expect.any(Function));

            // New device tools
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSwitchDetail', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayDetail', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayWanStatus', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayLanStatus', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGatewayPorts', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getApDetail', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getApRadios', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getStackPorts', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listPendingDevices', expect.any(Object), expect.any(Function));

            // Security tools
            expect(mockServer.registerTool).toHaveBeenCalledWith('getTopThreats', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteThreatManagement', expect.any(Object), expect.any(Function));

            // Network tools
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWanLanStatus', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listPortForwardingRules', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listAllSsids', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getVpnSettings', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteToSiteVpns', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listOsgAcls', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listEapAcls', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listStaticRoutes', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listRadiusProfiles', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listGroupProfiles', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getApplicationControlStatus', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSshSetting', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listTimeRangeProfiles', expect.any(Object), expect.any(Function));

            // Dashboard tools
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardWifiSummary', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardSwitchSummary', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardTrafficActivities', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardPoEUsage', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardTopCpuUsage', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardTopMemoryUsage', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardMostActiveSwitches', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardMostActiveEaps', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDashboardOverview', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getTrafficDistribution', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRetryAndDroppedRate', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getIspLoad', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getChannels', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getInterference', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridDashboardTunnelStats', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridDashboardIpsecTunnelStats', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGridDashboardOpenVpnTunnelStats', expect.any(Object), expect.any(Function));

            // Insight tools
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWids', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRogueAps', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getVpnTunnelStats', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getIpsecVpnStats', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWidsBlacklist', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRoutingTable', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getThreatDetail', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getThreatCount', expect.any(Object), expect.any(Function));

            // Log tools
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteEvents', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteAlerts', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSiteAuditLogs', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listGlobalEvents', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listGlobalAlerts', expect.any(Object), expect.any(Function));

            // Device read tools (issue #73) — spec-verified only
            expect(mockServer.registerTool).toHaveBeenCalledWith('getFirmwareUpgradePlan', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUpgradeLogs', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDeviceTagList', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getApQosConfig', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getApIpv6Config', expect.any(Object), expect.any(Function));

            // Phase 2 device read tools (issue #73)
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUpgradeOverviewCritical', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUpgradeOverviewTryBeta', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listUpgradeFirmwares', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listUpgradeOverviewFirmwares', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSitesStacks', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesDeviceWhiteList', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesSwitchesEs', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesSwitchesEsGeneralConfig', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSitesCableTestSwitchesPorts', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'listSitesCableTestSwitchesIncrementResults',
                expect.any(Object),
                expect.any(Function)
            );
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsIpSetting', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsChannelLimit', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsAvailableChannel', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsLoadBalance', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsOfdma', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsPowerSaving', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsTrunkSetting', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesApsBridge', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setApConfig', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setApChannelLimit', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setApPowerSaving', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('listSitesApsPorts', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesGatewaysGeneralConfig', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesGatewaysPin', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesGatewaysSimCardUsed', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSitesHealthGatewaysWansDetails', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setGatewayConfig', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('createDhcpReservation', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('updateDhcpReservation', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('deleteDhcpReservation', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setAclConfigTypeSetting', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('createGatewayAcl', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('createEapAcl', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('updateGatewayAcl', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('updateEapAcl', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('deleteAcl', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setFirewallSetting', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setAccessControl', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setAppControlRule', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('deleteAppControlRule', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('setBandwidthControlRule', expect.any(Object), expect.any(Function));
            expect(mockServer.registerTool).toHaveBeenCalledWith('deleteBandwidthControlRule', expect.any(Object), expect.any(Function));

            // Verify total number of tools registered
            expect(mockServer.registerTool).toHaveBeenCalledTimes(351);
        });
    });
});
