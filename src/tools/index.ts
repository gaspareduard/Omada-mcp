import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { registerDisableClientRateLimitTool } from './disableClientRateLimit.js';
import { registerGetApDetailTool } from './getApDetail.js';
import { registerGetApplicationControlStatusTool } from './getApplicationControlStatus.js';
import { registerGetApRadiosTool } from './getApRadios.js';
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
import { registerGetFirewallSettingTool } from './getFirewallSetting.js';
import { registerGetGatewayDetailTool } from './getGatewayDetail.js';
import { registerGetGatewayLanStatusTool } from './getGatewayLanStatus.js';
import { registerGetGatewayPortsTool } from './getGatewayPorts.js';
import { registerGetGatewayWanStatusTool } from './getGatewayWanStatus.js';
import { registerGetInternetInfoTool } from './getInternetInfo.js';
import { registerGetLanNetworkListTool } from './getLanNetworkList.js';
import { registerGetLanProfileListTool } from './getLanProfileList.js';
import { registerGetPortForwardingStatusTool } from './getPortForwardingStatus.js';
import { registerGetRateLimitProfilesTool } from './getRateLimitProfiles.js';
import { registerGetRogueApsTool } from './getRogueAps.js';
import { registerGetSshSettingTool } from './getSshSetting.js';
import { registerGetSsidDetailTool } from './getSsidDetail.js';
import { registerGetSsidListTool } from './getSsidList.js';
import { registerGetStackPortsTool } from './getStackPorts.js';
import { registerGetSwitchDetailTool } from './getSwitchDetail.js';
import { registerGetSwitchStackDetailTool } from './getSwitchStackDetail.js';
import { registerGetThreatListTool } from './getThreatList.js';
import { registerGetTopThreatsTool } from './getTopThreats.js';
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
