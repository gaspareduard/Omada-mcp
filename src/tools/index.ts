import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { registerDisableClientRateLimitTool } from './disableClientRateLimit.js';
import { registerGetAllDeviceBySiteTool } from './getAllDeviceBySite.js';
import { registerGetApDetailTool } from './getApDetail.js';
import { registerGetApGeneralConfigTool } from './getApGeneralConfig.js';
import { registerGetApLldpConfigTool } from './getApLldpConfig.js';
import { registerGetApplicationControlStatusTool } from './getApplicationControlStatus.js';
import { registerGetApRadiosTool } from './getApRadios.js';
import { registerGetApSnmpConfigTool } from './getApSnmpConfig.js';
import { registerGetApUplinkConfigTool } from './getApUplinkConfig.js';
import { registerGetApVlanConfigTool } from './getApVlanConfig.js';
import { registerGetCableTestFullResultsTool } from './getCableTestFullResults.js';
import { registerGetCableTestLogsTool } from './getCableTestLogs.js';
import { registerGetChannelsTool } from './getChannels.js';
import { registerGetClientTool } from './getClient.js';
import { registerGetDashboardMostActiveEapsTool } from './getDashboardMostActiveEaps.js';
import { registerGetDashboardMostActiveSwitchesTool } from './getDashboardMostActiveSwitches.js';
import { registerGetDashboardOverviewTool } from './getDashboardOverview.js';
import { registerGetDashboardPoEUsageTool } from './getDashboardPoEUsage.js';
import { registerGetDashboardSwitchSummaryTool } from './getDashboardSwitchSummary.js';
import { registerGetDashboardTopCpuUsageTool } from './getDashboardTopCpuUsage.js';
import { registerGetDashboardTopMemoryUsageTool } from './getDashboardTopMemoryUsage.js';
import { registerGetDashboardTrafficActivitiesTool } from './getDashboardTrafficActivities.js';
import { registerGetDashboardWifiSummaryTool } from './getDashboardWifiSummary.js';
import { registerGetDeviceTool } from './getDevice.js';
import { registerGetDownlinkWiredDevicesTool } from './getDownlinkWiredDevices.js';
import { registerGetFirewallSettingTool } from './getFirewallSetting.js';
import { registerGetFirmwareInfoTool } from './getFirmwareInfo.js';
import { registerGetGatewayDetailTool } from './getGatewayDetail.js';
import { registerGetGatewayLanStatusTool } from './getGatewayLanStatus.js';
import { registerGetGatewayPortsTool } from './getGatewayPorts.js';
import { registerGetGatewayWanStatusTool } from './getGatewayWanStatus.js';
import { registerGetGridAutoCheckUpgradeTool } from './getGridAutoCheckUpgrade.js';
import { registerGetGridDashboardIpsecTunnelStatsTool } from './getGridDashboardIpsecTunnelStats.js';
import { registerGetGridDashboardOpenVpnTunnelStatsTool } from './getGridDashboardOpenVpnTunnelStats.js';
import { registerGetGridDashboardTunnelStatsTool } from './getGridDashboardTunnelStats.js';
import { registerGetInterferenceTool } from './getInterference.js';
import { registerGetInternetInfoTool } from './getInternetInfo.js';
import { registerGetIspLoadTool } from './getIspLoad.js';
import { registerGetLanNetworkListTool } from './getLanNetworkList.js';
import { registerGetLanProfileListTool } from './getLanProfileList.js';
import { registerGetMeshStatisticsTool } from './getMeshStatistics.js';
import { registerGetOswStackLagListTool } from './getOswStackLagList.js';
import { registerGetPortForwardingStatusTool } from './getPortForwardingStatus.js';
import { registerGetRadiosConfigTool } from './getRadiosConfig.js';
import { registerGetRateLimitProfilesTool } from './getRateLimitProfiles.js';
import { registerGetRetryAndDroppedRateTool } from './getRetryAndDroppedRate.js';
import { registerGetRFScanResultTool } from './getRFScanResult.js';
import { registerGetRogueApsTool } from './getRogueAps.js';
import { registerGetSpeedTestResultsTool } from './getSpeedTestResults.js';
import { registerGetSshSettingTool } from './getSshSetting.js';
import { registerGetSsidDetailTool } from './getSsidDetail.js';
import { registerGetSsidListTool } from './getSsidList.js';
import { registerGetStackNetworkListTool } from './getStackNetworkList.js';
import { registerGetStackPortsTool } from './getStackPorts.js';
import { registerGetSwitchDetailTool } from './getSwitchDetail.js';
import { registerGetSwitchGeneralConfigTool } from './getSwitchGeneralConfig.js';
import { registerGetSwitchStackDetailTool } from './getSwitchStackDetail.js';
import { registerGetThreatListTool } from './getThreatList.js';
import { registerGetTopThreatsTool } from './getTopThreats.js';
import { registerGetTrafficDistributionTool } from './getTrafficDistribution.js';
import { registerGetUplinkWiredDetailTool } from './getUplinkWiredDetail.js';
import { registerGetVpnSettingsTool } from './getVpnSettings.js';
import { registerGetVpnTunnelStatsTool } from './getVpnTunnelStats.js';
import { registerGetWanLanStatusTool } from './getWanLanStatus.js';
import { registerGetWidsTool } from './getWids.js';
import { registerGetWlanGroupListTool } from './getWlanGroupList.js';
import { registerListAllSsidsTool } from './listAllSsids.js';
import { registerListClientsTool } from './listClients.js';
import { registerListClientsActivityTool } from './listClientsActivity.js';
import { registerListClientsPastConnectionsTool } from './listClientsPastConnections.js';
import { registerListDevicesTool } from './listDevices.js';
import { registerListDevicesStatsTool } from './listDevicesStats.js';
import { registerListEapAclsTool } from './listEapAcls.js';
import { registerListGlobalAlertsTool } from './listGlobalAlerts.js';
import { registerListGlobalEventsTool } from './listGlobalEvents.js';
import { registerListGroupProfilesTool } from './listGroupProfiles.js';
import { registerListMostActiveClientsTool } from './listMostActiveClients.js';
import { registerListOsgAclsTool } from './listOsgAcls.js';
import { registerListPendingDevicesTool } from './listPendingDevices.js';
import { registerListPortForwardingRulesTool } from './listPortForwardingRules.js';
import { registerListRadiusProfilesTool } from './listRadiusProfiles.js';
import { registerListSiteAlertsTool } from './listSiteAlerts.js';
import { registerListSiteAuditLogsTool } from './listSiteAuditLogs.js';
import { registerListSiteEventsTool } from './listSiteEvents.js';
import { registerListSitesTool } from './listSites.js';
import { registerListSiteThreatManagementTool } from './listSiteThreatManagement.js';
import { registerListSiteToSiteVpnsTool } from './listSiteToSiteVpns.js';
import { registerListStaticRoutesTool } from './listStaticRoutes.js';
import { registerListSwitchNetworksTool } from './listSwitchNetworks.js';
import { registerListTimeRangeProfilesTool } from './listTimeRangeProfiles.js';
import { registerSearchDevicesTool } from './searchDevices.js';
import { registerSetClientRateLimitTool } from './setClientRateLimit.js';
import { registerSetClientRateLimitProfileTool } from './setClientRateLimitProfile.js';

export function registerAllTools(server: McpServer, client: OmadaClient): void {
    // Site operations
    registerListSitesTool(server, client);

    // Device operations
    registerListDevicesTool(server, client);
    registerGetDeviceTool(server, client);
    registerGetSwitchStackDetailTool(server, client);
    registerGetSwitchDetailTool(server, client);
    registerGetGatewayDetailTool(server, client);
    registerGetGatewayWanStatusTool(server, client);
    registerGetGatewayLanStatusTool(server, client);
    registerGetGatewayPortsTool(server, client);
    registerGetApDetailTool(server, client);
    registerGetApRadiosTool(server, client);
    registerGetStackPortsTool(server, client);
    registerListPendingDevicesTool(server, client);
    registerSearchDevicesTool(server, client);
    registerListDevicesStatsTool(server, client);
    // Issue #36 — Device management read tools
    registerGetAllDeviceBySiteTool(server, client);
    registerGetFirmwareInfoTool(server, client);
    registerGetGridAutoCheckUpgradeTool(server, client);
    registerListSwitchNetworksTool(server, client);
    registerGetSwitchGeneralConfigTool(server, client);
    registerGetCableTestLogsTool(server, client);
    registerGetCableTestFullResultsTool(server, client);
    registerGetOswStackLagListTool(server, client);
    registerGetStackNetworkListTool(server, client);
    registerGetApUplinkConfigTool(server, client);
    registerGetRadiosConfigTool(server, client);
    registerGetApVlanConfigTool(server, client);
    registerGetMeshStatisticsTool(server, client);
    registerGetRFScanResultTool(server, client);
    registerGetSpeedTestResultsTool(server, client);
    registerGetApSnmpConfigTool(server, client);
    registerGetApLldpConfigTool(server, client);
    registerGetApGeneralConfigTool(server, client);
    registerGetUplinkWiredDetailTool(server, client);
    registerGetDownlinkWiredDevicesTool(server, client);

    // Client operations
    registerListClientsTool(server, client);
    registerGetClientTool(server, client);
    registerListMostActiveClientsTool(server, client);
    registerListClientsActivityTool(server, client);
    registerListClientsPastConnectionsTool(server, client);

    // Rate limit operations
    registerGetRateLimitProfilesTool(server, client);
    registerSetClientRateLimitTool(server, client);
    registerSetClientRateLimitProfileTool(server, client);
    registerDisableClientRateLimitTool(server, client);

    // Security / threat operations
    registerGetThreatListTool(server, client);
    registerGetTopThreatsTool(server, client);
    registerListSiteThreatManagementTool(server, client);

    // Network operations
    registerGetInternetInfoTool(server, client);
    registerGetWanLanStatusTool(server, client);
    registerGetPortForwardingStatusTool(server, client);
    registerListPortForwardingRulesTool(server, client);
    registerGetLanNetworkListTool(server, client);
    registerGetLanProfileListTool(server, client);
    registerGetWlanGroupListTool(server, client);
    registerGetSsidListTool(server, client);
    registerGetSsidDetailTool(server, client);
    registerListAllSsidsTool(server, client);
    registerGetFirewallSettingTool(server, client);
    registerGetVpnSettingsTool(server, client);
    registerListSiteToSiteVpnsTool(server, client);
    registerListOsgAclsTool(server, client);
    registerListEapAclsTool(server, client);
    registerListStaticRoutesTool(server, client);
    registerListRadiusProfilesTool(server, client);
    registerListGroupProfilesTool(server, client);
    registerGetApplicationControlStatusTool(server, client);
    registerGetSshSettingTool(server, client);
    registerListTimeRangeProfilesTool(server, client);

    // Monitor / dashboard operations
    registerGetDashboardWifiSummaryTool(server, client);
    registerGetDashboardSwitchSummaryTool(server, client);
    registerGetDashboardTrafficActivitiesTool(server, client);
    registerGetDashboardPoEUsageTool(server, client);
    registerGetDashboardTopCpuUsageTool(server, client);
    registerGetDashboardTopMemoryUsageTool(server, client);
    registerGetDashboardMostActiveSwitchesTool(server, client);
    registerGetDashboardMostActiveEapsTool(server, client);
    registerGetDashboardOverviewTool(server, client);
    registerGetTrafficDistributionTool(server, client);
    registerGetRetryAndDroppedRateTool(server, client);
    registerGetIspLoadTool(server, client);
    registerGetChannelsTool(server, client);
    registerGetInterferenceTool(server, client);
    registerGetGridDashboardTunnelStatsTool(server, client);
    registerGetGridDashboardIpsecTunnelStatsTool(server, client);
    registerGetGridDashboardOpenVpnTunnelStatsTool(server, client);

    // Insight operations
    registerGetWidsTool(server, client);
    registerGetRogueApsTool(server, client);
    registerGetVpnTunnelStatsTool(server, client);

    // Log operations
    registerListSiteEventsTool(server, client);
    registerListSiteAlertsTool(server, client);
    registerListSiteAuditLogsTool(server, client);
    registerListGlobalEventsTool(server, client);
    registerListGlobalAlertsTool(server, client);
}
