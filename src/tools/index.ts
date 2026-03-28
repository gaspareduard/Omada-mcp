import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ToolCategory, ToolPermission } from '../config.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { logger } from '../utils/logger.js';
import { registerDisableClientRateLimitTool } from './disableClientRateLimit.js';
import { registerGetAccessControlTool } from './getAccessControl.js';
import { registerGetAclConfigTypeSettingTool } from './getAclConfigTypeSetting.js';
import { registerGetAlgTool } from './getAlg.js';
import { registerGetAllDeviceBySiteTool } from './getAllDeviceBySite.js';
import { registerGetApDetailTool } from './getApDetail.js';
import { registerGetApGeneralConfigTool } from './getApGeneralConfig.js';
import { registerGetApIpv6ConfigTool } from './getApIpv6Config.js';
import { registerGetApLldpConfigTool } from './getApLldpConfig.js';
import { registerGetApplicationControlStatusTool } from './getApplicationControlStatus.js';
import { registerGetApQosConfigTool } from './getApQosConfig.js';
import { registerGetApRadiosTool } from './getApRadios.js';
import { registerGetApSnmpConfigTool } from './getApSnmpConfig.js';
import { registerGetApUplinkConfigTool } from './getApUplinkConfig.js';
import { registerGetApVlanConfigTool } from './getApVlanConfig.js';
import { registerGetAttackDefenseSettingTool } from './getAttackDefenseSetting.js';
import { registerGetAuditLogSettingForGlobalTool } from './getAuditLogSettingForGlobal.js';
import { registerGetAuditLogSettingForSiteTool } from './getAuditLogSettingForSite.js';
import { registerGetAuditLogsForGlobalTool } from './getAuditLogsForGlobal.js';
import { registerGetBandSteeringSettingTool } from './getBandSteeringSetting.js';
import { registerGetBandwidthControlTool } from './getBandwidthControl.js';
import { registerGetBandwidthCtrlTool } from './getBandwidthCtrl.js';
import { registerGetBeaconControlSettingTool } from './getBeaconControlSetting.js';
import { registerGetCableTestFullResultsTool } from './getCableTestFullResults.js';
import { registerGetCableTestLogsTool } from './getCableTestLogs.js';
import { registerGetChannelLimitSettingTool } from './getChannelLimitSetting.js';
import { registerGetChannelsTool } from './getChannels.js';
import { registerGetClientTool } from './getClient.js';
import { registerGetClientActiveTimeoutTool } from './getClientActiveTimeout.js';
import { registerGetClientDetailTool } from './getClientDetail.js';
import { registerGetClientsDistributionTool } from './getClientsDistribution.js';
import { registerGetClientToSiteVpnServerInfoTool } from './getClientToSiteVpnServerInfo.js';
import { registerGetControllerStatusTool } from './getControllerStatus.js';
import { registerGetDashboardMostActiveEapsTool } from './getDashboardMostActiveEaps.js';
import { registerGetDashboardMostActiveSwitchesTool } from './getDashboardMostActiveSwitches.js';
import { registerGetDashboardOverviewTool } from './getDashboardOverview.js';
import { registerGetDashboardPoEUsageTool } from './getDashboardPoEUsage.js';
import { registerGetDashboardSwitchSummaryTool } from './getDashboardSwitchSummary.js';
import { registerGetDashboardTopCpuUsageTool } from './getDashboardTopCpuUsage.js';
import { registerGetDashboardTopMemoryUsageTool } from './getDashboardTopMemoryUsage.js';
import { registerGetDashboardTrafficActivitiesTool } from './getDashboardTrafficActivities.js';
import { registerGetDashboardWifiSummaryTool } from './getDashboardWifiSummary.js';
import { registerGetDdnsGridTool } from './getDdnsGrid.js';
import { registerGetDeviceTool } from './getDevice.js';
import { registerGetDeviceAccessManagementTool } from './getDeviceAccessManagement.js';
import { registerGetDeviceTagListTool } from './getDeviceTagList.js';
import { registerGetDhcpReservationGridTool } from './getDhcpReservationGrid.js';
import { registerGetDnsCacheSettingTool } from './getDnsCacheSetting.js';
import { registerGetDnsProxyTool } from './getDnsProxy.js';
import { registerGetDownlinkWiredDevicesTool } from './getDownlinkWiredDevices.js';
import { registerGetEapDot1xSettingTool } from './getEapDot1xSetting.js';
import { registerGetFirewallSettingTool } from './getFirewallSetting.js';
import { registerGetFirmwareInfoTool } from './getFirmwareInfo.js';
import { registerGetFirmwareUpgradePlanTool } from './getFirmwareUpgradePlan.js';
import { registerGetGatewayDetailTool } from './getGatewayDetail.js';
import { registerGetGatewayLanStatusTool } from './getGatewayLanStatus.js';
import { registerGetGatewayPortsTool } from './getGatewayPorts.js';
import { registerGetGatewayWanStatusTool } from './getGatewayWanStatus.js';
import { registerGetGeneralSettingsTool } from './getGeneralSettings.js';
import { registerGetGridAllowListTool } from './getGridAllowList.js';
import { registerGetGridAllowMacFilteringTool } from './getGridAllowMacFiltering.js';
import { registerGetGridAutoCheckUpgradeTool } from './getGridAutoCheckUpgrade.js';
import { registerGetGridBandwidthCtrlRuleTool } from './getGridBandwidthCtrlRule.js';
import { registerGetGridBlockListTool } from './getGridBlockList.js';
import { registerGetGridClientHistoryTool } from './getGridClientHistory.js';
import { registerGetGridDashboardIpsecTunnelStatsTool } from './getGridDashboardIpsecTunnelStats.js';
import { registerGetGridDashboardOpenVpnTunnelStatsTool } from './getGridDashboardOpenVpnTunnelStats.js';
import { registerGetGridDashboardTunnelStatsTool } from './getGridDashboardTunnelStats.js';
import { registerGetGridDenyMacFilteringTool } from './getGridDenyMacFiltering.js';
import { registerGetGridEapRuleTool } from './getGridEapRule.js';
import { registerGetGridGatewayRuleTool } from './getGridGatewayRule.js';
import { registerGetGridIpMacBindingTool } from './getGridIpMacBinding.js';
import { registerGetGridIpsecFailoverTool } from './getGridIpsecFailover.js';
import { registerGetGridKnownClientsTool } from './getGridKnownClients.js';
import { registerGetGridOtoNatsTool } from './getGridOtoNats.js';
import { registerGetGridPolicyRoutingTool } from './getGridPolicyRouting.js';
import { registerGetGridSessionLimitRuleTool } from './getGridSessionLimitRule.js';
import { registerGetGridSignatureTool } from './getGridSignature.js';
import { registerGetGridStaticRoutingTool } from './getGridStaticRouting.js';
import { registerGetGridVirtualWanTool } from './getGridVirtualWan.js';
import { registerGetGroupProfilesByTypeTool } from './getGroupProfilesByType.js';
import { registerGetIgmpTool } from './getIgmp.js';
import { registerGetInterfaceLanNetworkTool } from './getInterfaceLanNetwork.js';
import { registerGetInterfaceLanNetworkV2Tool } from './getInterfaceLanNetworkV2.js';
import { registerGetInterferenceTool } from './getInterference.js';
import { registerGetInternetTool } from './getInternet.js';
import { registerGetInternetBasicPortInfoTool } from './getInternetBasicPortInfo.js';
import { registerGetInternetInfoTool } from './getInternetInfo.js';
import { registerGetInternetLoadBalanceTool } from './getInternetLoadBalance.js';
import { registerGetIpMacBindingGeneralSettingTool } from './getIpMacBindingGeneralSetting.js';
import { registerGetIpsConfigTool } from './getIpsConfig.js';
import { registerGetIpsecVpnStatsTool } from './getIpsecVpnStats.js';
import { registerGetIspLoadTool } from './getIspLoad.js';
import { registerGetLanNetworkListTool } from './getLanNetworkList.js';
import { registerGetLanNetworkListV2Tool } from './getLanNetworkListV2.js';
import { registerGetLanProfileListTool } from './getLanProfileList.js';
import { registerGetLdapProfileListTool } from './getLdapProfileList.js';
import { registerGetLldpSettingTool } from './getLldpSetting.js';
import { registerGetLoggingTool } from './getLogging.js';
import { registerGetLogSettingForGlobalTool } from './getLogSettingForGlobal.js';
import { registerGetLogSettingForGlobalV2Tool } from './getLogSettingForGlobalV2.js';
import { registerGetLogSettingForSiteTool } from './getLogSettingForSite.js';
import { registerGetLogSettingForSiteV2Tool } from './getLogSettingForSiteV2.js';
import { registerGetMacAuthSettingTool } from './getMacAuthSetting.js';
import { registerGetMacAuthSsidsTool } from './getMacAuthSsids.js';
import { registerGetMacFilteringGeneralSettingTool } from './getMacFilteringGeneralSetting.js';
import { registerGetMailServerStatusTool } from './getMailServerStatus.js';
import { registerGetMeshSettingTool } from './getMeshSetting.js';
import { registerGetMeshStatisticsTool } from './getMeshStatistics.js';
import { registerGetOsgCustomAclListTool } from './getOsgCustomAclList.js';
import { registerGetOswAclListTool } from './getOswAclList.js';
import { registerGetOswStackLagListTool } from './getOswStackLagList.js';
import { registerGetOuiProfileListTool } from './getOuiProfileList.js';
import { registerGetPastClientNumTool } from './getPastClientNum.js';
import { registerGetPortForwardingListTool } from './getPortForwardingList.js';
import { registerGetPortForwardingStatusTool } from './getPortForwardingStatus.js';
import { registerGetPPSKProfilesTool } from './getPPSKProfiles.js';
import { registerGetRadioFrequencyPlanningConfigTool } from './getRadioFrequencyPlanningConfig.js';
import { registerGetRadioFrequencyPlanningResultTool } from './getRadioFrequencyPlanningResult.js';
import { registerGetRadiosConfigTool } from './getRadiosConfig.js';
import { registerGetRadiusServerTool } from './getRadiusServer.js';
import { registerGetRadiusUserListTool } from './getRadiusUserList.js';
import { registerGetRateLimitProfilesTool } from './getRateLimitProfiles.js';
import { registerGetRemoteLoggingTool } from './getRemoteLogging.js';
import { registerGetRemoteLoggingSettingTool } from './getRemoteLoggingSetting.js';
import { registerGetRetentionTool } from './getRetention.js';
import { registerGetRetryAndDroppedRateTool } from './getRetryAndDroppedRate.js';
import { registerGetRFScanResultTool } from './getRFScanResult.js';
import { registerGetRoamingSettingTool } from './getRoamingSetting.js';
import { registerGetRogueApsTool } from './getRogueAps.js';
import { registerGetRoutingTableTool } from './getRoutingTable.js';
import { registerGetServiceTypeSummaryTool } from './getServiceTypeSummary.js';
import { registerGetSessionLimitTool } from './getSessionLimit.js';
import { registerGetSitesApsAvailableChannelTool } from './getSitesApsAvailableChannel.js';
import { registerGetSitesApsBridgeTool } from './getSitesApsBridge.js';
import { registerGetSitesApsChannelLimitTool } from './getSitesApsChannelLimit.js';
import { registerGetSitesApsIpSettingTool } from './getSitesApsIpSetting.js';
import { registerGetSitesApsLoadBalanceTool } from './getSitesApsLoadBalance.js';
import { registerGetSitesApsOfdmaTool } from './getSitesApsOfdma.js';
import { registerGetSitesApsPowerSavingTool } from './getSitesApsPowerSaving.js';
import { registerGetSitesApsTrunkSettingTool } from './getSitesApsTrunkSetting.js';
import { registerGetSitesDeviceWhiteListTool } from './getSitesDeviceWhiteList.js';
import { registerGetSitesGatewaysGeneralConfigTool } from './getSitesGatewaysGeneralConfig.js';
import { registerGetSitesGatewaysPinTool } from './getSitesGatewaysPin.js';
import { registerGetSitesGatewaysSimCardUsedTool } from './getSitesGatewaysSimCardUsed.js';
import { registerGetSitesHealthGatewaysWansDetailsTool } from './getSitesHealthGatewaysWansDetails.js';
import { registerGetSitesSwitchesEsTool } from './getSitesSwitchesEs.js';
import { registerGetSitesSwitchesEsGeneralConfigTool } from './getSitesSwitchesEsGeneralConfig.js';
import { registerGetSiteToSiteVpnInfoTool } from './getSiteToSiteVpnInfo.js';
import { registerGetSnmpSettingTool } from './getSnmpSetting.js';
import { registerGetSpeedTestResultsTool } from './getSpeedTestResults.js';
import { registerGetSshSettingTool } from './getSshSetting.js';
import { registerGetSsidDetailTool } from './getSsidDetail.js';
import { registerGetSsidListTool } from './getSsidList.js';
import { registerGetSsidsBySiteTool } from './getSsidsBySite.js';
import { registerGetSslVpnServerSettingTool } from './getSslVpnServerSetting.js';
import { registerGetStackNetworkListTool } from './getStackNetworkList.js';
import { registerGetStackPortsTool } from './getStackPorts.js';
import { registerGetStaticRoutingInterfaceListTool } from './getStaticRoutingInterfaceList.js';
import { registerGetSwitchDetailTool } from './getSwitchDetail.js';
import { registerGetSwitchDot1xSettingTool } from './getSwitchDot1xSetting.js';
import { registerGetSwitchGeneralConfigTool } from './getSwitchGeneralConfig.js';
import { registerGetSwitchStackDetailTool } from './getSwitchStackDetail.js';
import { registerGetThreatCountTool } from './getThreatCount.js';
import { registerGetThreatDetailTool } from './getThreatDetail.js';
import { registerGetThreatListTool } from './getThreatList.js';
import { registerGetTopThreatsTool } from './getTopThreats.js';
import { registerGetTrafficDistributionTool } from './getTrafficDistribution.js';
import { registerGetUiInterfaceTool } from './getUiInterface.js';
import { registerGetUpgradeLogsTool } from './getUpgradeLogs.js';
import { registerGetUpgradeOverviewCriticalTool } from './getUpgradeOverviewCritical.js';
import { registerGetUpgradeOverviewTryBetaTool } from './getUpgradeOverviewTryBeta.js';
import { registerGetUplinkWiredDetailTool } from './getUplinkWiredDetail.js';
import { registerGetUpnpSettingTool } from './getUpnpSetting.js';
import { registerGetUrlFilterGeneralTool } from './getUrlFilterGeneral.js';
import { registerGetVpnSettingsTool } from './getVpnSettings.js';
import { registerGetVpnTunnelStatsTool } from './getVpnTunnelStats.js';
import { registerGetWanLanStatusTool } from './getWanLanStatus.js';
import { registerGetWanPortsConfigTool } from './getWanPortsConfig.js';
import { registerGetWebhookForGlobalTool } from './getWebhookForGlobal.js';
import { registerGetWebhookLogsForGlobalTool } from './getWebhookLogsForGlobal.js';
import { registerGetWidsTool } from './getWids.js';
import { registerGetWidsBlacklistTool } from './getWidsBlacklist.js';
import { registerGetWireguardSummaryTool } from './getWireguardSummary.js';
import { registerGetWlanGroupListTool } from './getWlanGroupList.js';
import { registerListAllSsidsTool } from './listAllSsids.js';
import { registerListClientsTool } from './listClients.js';
import { registerListClientsActivityTool } from './listClientsActivity.js';
import { registerListClientsPastConnectionsTool } from './listClientsPastConnections.js';
import { registerListClientToSiteVpnClientsTool } from './listClientToSiteVpnClients.js';
import { registerListClientToSiteVpnServersTool } from './listClientToSiteVpnServers.js';
import { registerListDevicesTool } from './listDevices.js';
import { registerListDevicesStatsTool } from './listDevicesStats.js';
import { registerListEapAclsTool } from './listEapAcls.js';
import { registerListGlobalAlertsTool } from './listGlobalAlerts.js';
import { registerListGlobalEventsTool } from './listGlobalEvents.js';
import { registerListGroupProfilesTool } from './listGroupProfiles.js';
import { registerListMdnsProfileTool } from './listMdnsProfile.js';
import { registerListMostActiveClientsTool } from './listMostActiveClients.js';
import { registerListOsgAclsTool } from './listOsgAcls.js';
import { registerListPendingDevicesTool } from './listPendingDevices.js';
import { registerListPolicyRoutesTool } from './listPolicyRoutes.js';
import { registerListPortForwardingRulesTool } from './listPortForwardingRules.js';
import { registerListRadiusProfilesTool } from './listRadiusProfiles.js';
import { registerListServiceTypeTool } from './listServiceType.js';
import { registerListSiteAlertsTool } from './listSiteAlerts.js';
import { registerListSiteAuditLogsTool } from './listSiteAuditLogs.js';
import { registerListSiteEventsTool } from './listSiteEvents.js';
import { registerListSitesTool } from './listSites.js';
import { registerListSitesApsPortsTool } from './listSitesApsPorts.js';
import { registerListSitesCableTestSwitchesIncrementResultsTool } from './listSitesCableTestSwitchesIncrementResults.js';
import { registerListSitesCableTestSwitchesPortsTool } from './listSitesCableTestSwitchesPorts.js';
import { registerListSitesStacksTool } from './listSitesStacks.js';
import { registerListSiteThreatManagementTool } from './listSiteThreatManagement.js';
import { registerListSiteToSiteVpnsTool } from './listSiteToSiteVpns.js';
import { registerListStaticRoutesTool } from './listStaticRoutes.js';
import { registerListSwitchNetworksTool } from './listSwitchNetworks.js';
import { registerListTimeRangeProfilesTool } from './listTimeRangeProfiles.js';
import { registerListUpgradeFirmwaresTool } from './listUpgradeFirmwares.js';
import { registerListUpgradeOverviewFirmwaresTool } from './listUpgradeOverviewFirmwares.js';
import { registerListWireguardTool } from './listWireguard.js';
import { registerListWireguardPeersTool } from './listWireguardPeers.js';
import { registerSearchDevicesTool } from './searchDevices.js';
import { registerSetClientRateLimitTool } from './setClientRateLimit.js';
import { registerSetClientRateLimitProfileTool } from './setClientRateLimitProfile.js';

// ---------------------------------------------------------------------------
// Tool registry: each entry maps a register-function to its category and
// permission type ('read' for pure read operations, 'write' for mutations).
// ---------------------------------------------------------------------------

interface ToolEntry {
    fn: (server: McpServer, client: OmadaClient) => void;
    category: ToolCategory;
    permission: ToolPermission;
}

const TOOL_REGISTRY: ToolEntry[] = [
    // --- Sites ---
    { fn: registerListSitesTool, category: 'sites', permission: 'read' },

    // --- Devices (general) ---
    { fn: registerListDevicesTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetDeviceTool, category: 'devices-general', permission: 'read' },
    { fn: registerListPendingDevicesTool, category: 'devices-general', permission: 'read' },
    { fn: registerSearchDevicesTool, category: 'devices-general', permission: 'read' },
    { fn: registerListDevicesStatsTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetAllDeviceBySiteTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetFirmwareInfoTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetGridAutoCheckUpgradeTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetUplinkWiredDetailTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetDownlinkWiredDevicesTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetSpeedTestResultsTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetFirmwareUpgradePlanTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetUpgradeLogsTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetDeviceTagListTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetUpgradeOverviewCriticalTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetUpgradeOverviewTryBetaTool, category: 'devices-general', permission: 'read' },
    { fn: registerListUpgradeFirmwaresTool, category: 'devices-general', permission: 'read' },
    { fn: registerListUpgradeOverviewFirmwaresTool, category: 'devices-general', permission: 'read' },
    { fn: registerListSitesStacksTool, category: 'devices-general', permission: 'read' },
    { fn: registerGetSitesDeviceWhiteListTool, category: 'devices-general', permission: 'read' },

    // --- Devices (switch) ---
    { fn: registerGetSwitchStackDetailTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetSwitchDetailTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetStackPortsTool, category: 'devices-switch', permission: 'read' },
    { fn: registerListSwitchNetworksTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetSwitchGeneralConfigTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetCableTestLogsTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetCableTestFullResultsTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetOswStackLagListTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetStackNetworkListTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetSwitchDot1xSettingTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetSitesSwitchesEsTool, category: 'devices-switch', permission: 'read' },
    { fn: registerGetSitesSwitchesEsGeneralConfigTool, category: 'devices-switch', permission: 'read' },
    { fn: registerListSitesCableTestSwitchesPortsTool, category: 'devices-switch', permission: 'read' },
    { fn: registerListSitesCableTestSwitchesIncrementResultsTool, category: 'devices-switch', permission: 'read' },

    // --- Devices (AP) ---
    { fn: registerGetApDetailTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetApRadiosTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetApUplinkConfigTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetRadiosConfigTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetApVlanConfigTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetMeshStatisticsTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetRFScanResultTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetApSnmpConfigTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetApLldpConfigTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetApGeneralConfigTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetApQosConfigTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetApIpv6ConfigTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetSitesApsIpSettingTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetSitesApsChannelLimitTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetSitesApsAvailableChannelTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetSitesApsLoadBalanceTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetSitesApsOfdmaTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetSitesApsPowerSavingTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetSitesApsTrunkSettingTool, category: 'devices-ap', permission: 'read' },
    { fn: registerGetSitesApsBridgeTool, category: 'devices-ap', permission: 'read' },
    { fn: registerListSitesApsPortsTool, category: 'devices-ap', permission: 'read' },

    // --- Devices (gateway) ---
    { fn: registerGetGatewayDetailTool, category: 'devices-gateway', permission: 'read' },
    { fn: registerGetGatewayWanStatusTool, category: 'devices-gateway', permission: 'read' },
    { fn: registerGetGatewayLanStatusTool, category: 'devices-gateway', permission: 'read' },
    { fn: registerGetGatewayPortsTool, category: 'devices-gateway', permission: 'read' },
    { fn: registerGetSitesGatewaysGeneralConfigTool, category: 'devices-gateway', permission: 'read' },
    { fn: registerGetSitesGatewaysPinTool, category: 'devices-gateway', permission: 'read' },
    { fn: registerGetSitesGatewaysSimCardUsedTool, category: 'devices-gateway', permission: 'read' },
    { fn: registerGetSitesHealthGatewaysWansDetailsTool, category: 'devices-gateway', permission: 'read' },

    // --- Clients ---
    { fn: registerListClientsTool, category: 'clients', permission: 'read' },
    { fn: registerGetClientTool, category: 'clients', permission: 'read' },
    { fn: registerGetClientDetailTool, category: 'clients', permission: 'read' },
    { fn: registerGetGridKnownClientsTool, category: 'clients', permission: 'read' },
    { fn: registerGetGridClientHistoryTool, category: 'clients', permission: 'read' },
    { fn: registerSetClientRateLimitTool, category: 'clients', permission: 'write' },
    { fn: registerSetClientRateLimitProfileTool, category: 'clients', permission: 'write' },
    { fn: registerDisableClientRateLimitTool, category: 'clients', permission: 'write' },

    // --- Client insights ---
    { fn: registerListMostActiveClientsTool, category: 'client-insights', permission: 'read' },
    { fn: registerListClientsActivityTool, category: 'client-insights', permission: 'read' },
    { fn: registerListClientsPastConnectionsTool, category: 'client-insights', permission: 'read' },
    { fn: registerGetClientsDistributionTool, category: 'client-insights', permission: 'read' },
    { fn: registerGetPastClientNumTool, category: 'client-insights', permission: 'read' },

    // --- Security threat ---
    { fn: registerGetThreatListTool, category: 'security-threat', permission: 'read' },
    { fn: registerGetTopThreatsTool, category: 'security-threat', permission: 'read' },
    { fn: registerListSiteThreatManagementTool, category: 'security-threat', permission: 'read' },
    { fn: registerGetThreatDetailTool, category: 'security-threat', permission: 'read' },
    { fn: registerGetThreatCountTool, category: 'security-threat', permission: 'read' },

    // --- Security WIDS ---
    { fn: registerGetWidsTool, category: 'security-wids', permission: 'read' },
    { fn: registerGetWidsBlacklistTool, category: 'security-wids', permission: 'read' },
    { fn: registerGetRogueApsTool, category: 'security-wids', permission: 'read' },

    // --- Network WAN ---
    { fn: registerGetInternetInfoTool, category: 'network-wan', permission: 'read' },
    { fn: registerGetWanLanStatusTool, category: 'network-wan', permission: 'read' },
    { fn: registerGetWanPortsConfigTool, category: 'network-wan', permission: 'read' },
    { fn: registerGetInternetBasicPortInfoTool, category: 'network-wan', permission: 'read' },
    { fn: registerGetInternetTool, category: 'network-wan', permission: 'read' },
    { fn: registerGetGridVirtualWanTool, category: 'network-wan', permission: 'read' },
    { fn: registerGetInternetLoadBalanceTool, category: 'network-wan', permission: 'read' },

    // --- Network LAN ---
    { fn: registerGetLanNetworkListTool, category: 'network-lan', permission: 'read' },
    { fn: registerGetLanNetworkListV2Tool, category: 'network-lan', permission: 'read' },
    { fn: registerGetLanProfileListTool, category: 'network-lan', permission: 'read' },
    { fn: registerGetInterfaceLanNetworkTool, category: 'network-lan', permission: 'read' },
    { fn: registerGetInterfaceLanNetworkV2Tool, category: 'network-lan', permission: 'read' },
    { fn: registerGetDhcpReservationGridTool, category: 'network-lan', permission: 'read' },
    { fn: registerGetIpMacBindingGeneralSettingTool, category: 'network-lan', permission: 'read' },
    { fn: registerGetGridIpMacBindingTool, category: 'network-lan', permission: 'read' },
    { fn: registerGetDnsCacheSettingTool, category: 'network-lan', permission: 'read' },
    { fn: registerGetDnsProxyTool, category: 'network-lan', permission: 'read' },
    { fn: registerGetIgmpTool, category: 'network-lan', permission: 'read' },

    // --- Network NAT ---
    { fn: registerGetPortForwardingStatusTool, category: 'network-nat', permission: 'read' },
    { fn: registerGetPortForwardingListTool, category: 'network-nat', permission: 'read' },
    { fn: registerListPortForwardingRulesTool, category: 'network-nat', permission: 'read' },
    { fn: registerGetGridOtoNatsTool, category: 'network-nat', permission: 'read' },

    // --- Network routing ---
    { fn: registerListStaticRoutesTool, category: 'network-routing', permission: 'read' },
    { fn: registerGetStaticRoutingInterfaceListTool, category: 'network-routing', permission: 'read' },
    { fn: registerGetGridStaticRoutingTool, category: 'network-routing', permission: 'read' },
    { fn: registerListPolicyRoutesTool, category: 'network-routing', permission: 'read' },
    { fn: registerGetGridPolicyRoutingTool, category: 'network-routing', permission: 'read' },
    { fn: registerGetRoutingTableTool, category: 'network-routing', permission: 'read' },

    // --- Network services ---
    { fn: registerGetAlgTool, category: 'network-services', permission: 'read' },
    { fn: registerGetUpnpSettingTool, category: 'network-services', permission: 'read' },
    { fn: registerGetDdnsGridTool, category: 'network-services', permission: 'read' },
    { fn: registerGetBandwidthControlTool, category: 'network-services', permission: 'read' },
    { fn: registerGetBandwidthCtrlTool, category: 'network-services', permission: 'read' },
    { fn: registerGetGridBandwidthCtrlRuleTool, category: 'network-services', permission: 'read' },
    { fn: registerGetSessionLimitTool, category: 'network-services', permission: 'read' },
    { fn: registerGetGridSessionLimitRuleTool, category: 'network-services', permission: 'read' },
    { fn: registerGetSnmpSettingTool, category: 'network-services', permission: 'read' },
    { fn: registerGetLldpSettingTool, category: 'network-services', permission: 'read' },
    { fn: registerGetRemoteLoggingSettingTool, category: 'network-services', permission: 'read' },
    { fn: registerGetAccessControlTool, category: 'network-services', permission: 'read' },
    { fn: registerGetSshSettingTool, category: 'network-services', permission: 'read' },

    // --- Wireless SSID ---
    { fn: registerGetWlanGroupListTool, category: 'wireless-ssid', permission: 'read' },
    { fn: registerGetSsidListTool, category: 'wireless-ssid', permission: 'read' },
    { fn: registerGetSsidDetailTool, category: 'wireless-ssid', permission: 'read' },
    { fn: registerListAllSsidsTool, category: 'wireless-ssid', permission: 'read' },
    { fn: registerGetSsidsBySiteTool, category: 'wireless-ssid', permission: 'read' },

    // --- Wireless radio ---
    { fn: registerGetRadioFrequencyPlanningConfigTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetRadioFrequencyPlanningResultTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetBandSteeringSettingTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetBeaconControlSettingTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetChannelLimitSettingTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetMeshSettingTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetRoamingSettingTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetChannelsTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetInterferenceTool, category: 'wireless-radio', permission: 'read' },
    { fn: registerGetRetryAndDroppedRateTool, category: 'wireless-radio', permission: 'read' },

    // --- Wireless auth ---
    { fn: registerGetOuiProfileListTool, category: 'wireless-auth', permission: 'read' },
    { fn: registerGetMacAuthSettingTool, category: 'wireless-auth', permission: 'read' },
    { fn: registerGetMacAuthSsidsTool, category: 'wireless-auth', permission: 'read' },
    { fn: registerGetMacFilteringGeneralSettingTool, category: 'wireless-auth', permission: 'read' },
    { fn: registerGetGridAllowMacFilteringTool, category: 'wireless-auth', permission: 'read' },
    { fn: registerGetGridDenyMacFilteringTool, category: 'wireless-auth', permission: 'read' },
    { fn: registerGetEapDot1xSettingTool, category: 'wireless-auth', permission: 'read' },

    // --- Firewall ACL ---
    { fn: registerGetAclConfigTypeSettingTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerGetOsgCustomAclListTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerGetOswAclListTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerGetGridAllowListTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerGetGridBlockListTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerGetGridGatewayRuleTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerGetGridEapRuleTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerGetFirewallSettingTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerListOsgAclsTool, category: 'firewall-acl', permission: 'read' },
    { fn: registerListEapAclsTool, category: 'firewall-acl', permission: 'read' },

    // --- Firewall traffic ---
    { fn: registerGetUrlFilterGeneralTool, category: 'firewall-traffic', permission: 'read' },
    { fn: registerGetApplicationControlStatusTool, category: 'firewall-traffic', permission: 'read' },
    { fn: registerGetAttackDefenseSettingTool, category: 'firewall-traffic', permission: 'read' },

    // --- Firewall IDS ---
    { fn: registerGetIpsConfigTool, category: 'firewall-ids', permission: 'read' },
    { fn: registerGetGridSignatureTool, category: 'firewall-ids', permission: 'read' },

    // --- VPN ---
    { fn: registerGetVpnSettingsTool, category: 'vpn', permission: 'read' },
    { fn: registerListSiteToSiteVpnsTool, category: 'vpn', permission: 'read' },
    { fn: registerGetSiteToSiteVpnInfoTool, category: 'vpn', permission: 'read' },
    { fn: registerListWireguardTool, category: 'vpn', permission: 'read' },
    { fn: registerListWireguardPeersTool, category: 'vpn', permission: 'read' },
    { fn: registerGetWireguardSummaryTool, category: 'vpn', permission: 'read' },
    { fn: registerListClientToSiteVpnServersTool, category: 'vpn', permission: 'read' },
    { fn: registerListClientToSiteVpnClientsTool, category: 'vpn', permission: 'read' },
    { fn: registerGetClientToSiteVpnServerInfoTool, category: 'vpn', permission: 'read' },
    { fn: registerGetSslVpnServerSettingTool, category: 'vpn', permission: 'read' },
    { fn: registerGetGridIpsecFailoverTool, category: 'vpn', permission: 'read' },
    { fn: registerGetVpnTunnelStatsTool, category: 'vpn', permission: 'read' },
    { fn: registerGetIpsecVpnStatsTool, category: 'vpn', permission: 'read' },
    { fn: registerGetGridDashboardTunnelStatsTool, category: 'vpn', permission: 'read' },
    { fn: registerGetGridDashboardIpsecTunnelStatsTool, category: 'vpn', permission: 'read' },
    { fn: registerGetGridDashboardOpenVpnTunnelStatsTool, category: 'vpn', permission: 'read' },

    // --- Profiles ---
    { fn: registerListServiceTypeTool, category: 'profiles', permission: 'read' },
    { fn: registerGetServiceTypeSummaryTool, category: 'profiles', permission: 'read' },
    { fn: registerGetGroupProfilesByTypeTool, category: 'profiles', permission: 'read' },
    { fn: registerGetPPSKProfilesTool, category: 'profiles', permission: 'read' },
    { fn: registerListMdnsProfileTool, category: 'profiles', permission: 'read' },
    { fn: registerListGroupProfilesTool, category: 'profiles', permission: 'read' },
    { fn: registerListTimeRangeProfilesTool, category: 'profiles', permission: 'read' },
    { fn: registerGetRateLimitProfilesTool, category: 'profiles', permission: 'read' },

    // --- Auth profiles ---
    { fn: registerGetLdapProfileListTool, category: 'auth-profiles', permission: 'read' },
    { fn: registerGetRadiusUserListTool, category: 'auth-profiles', permission: 'read' },
    { fn: registerGetRadiusServerTool, category: 'auth-profiles', permission: 'read' },
    { fn: registerListRadiusProfilesTool, category: 'auth-profiles', permission: 'read' },

    // --- Logs ---
    { fn: registerListSiteEventsTool, category: 'logs', permission: 'read' },
    { fn: registerListSiteAlertsTool, category: 'logs', permission: 'read' },
    { fn: registerListSiteAuditLogsTool, category: 'logs', permission: 'read' },
    { fn: registerListGlobalEventsTool, category: 'logs', permission: 'read' },
    { fn: registerListGlobalAlertsTool, category: 'logs', permission: 'read' },
    { fn: registerGetLogSettingForSiteTool, category: 'logs', permission: 'read' },
    { fn: registerGetLogSettingForSiteV2Tool, category: 'logs', permission: 'read' },
    { fn: registerGetAuditLogSettingForSiteTool, category: 'logs', permission: 'read' },
    { fn: registerGetLogSettingForGlobalTool, category: 'logs', permission: 'read' },
    { fn: registerGetLogSettingForGlobalV2Tool, category: 'logs', permission: 'read' },
    { fn: registerGetAuditLogSettingForGlobalTool, category: 'logs', permission: 'read' },
    { fn: registerGetAuditLogsForGlobalTool, category: 'logs', permission: 'read' },

    // --- Controller ---
    { fn: registerGetControllerStatusTool, category: 'controller', permission: 'read' },
    { fn: registerGetGeneralSettingsTool, category: 'controller', permission: 'read' },
    { fn: registerGetRetentionTool, category: 'controller', permission: 'read' },
    { fn: registerGetClientActiveTimeoutTool, category: 'controller', permission: 'read' },
    { fn: registerGetRemoteLoggingTool, category: 'controller', permission: 'read' },
    { fn: registerGetLoggingTool, category: 'controller', permission: 'read' },
    { fn: registerGetUiInterfaceTool, category: 'controller', permission: 'read' },
    { fn: registerGetDeviceAccessManagementTool, category: 'controller', permission: 'read' },
    { fn: registerGetWebhookForGlobalTool, category: 'controller', permission: 'read' },
    { fn: registerGetWebhookLogsForGlobalTool, category: 'controller', permission: 'read' },
    { fn: registerGetMailServerStatusTool, category: 'controller', permission: 'read' },

    // --- Dashboard ---
    { fn: registerGetDashboardWifiSummaryTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetDashboardSwitchSummaryTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetDashboardTrafficActivitiesTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetDashboardPoEUsageTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetDashboardTopCpuUsageTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetDashboardTopMemoryUsageTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetDashboardMostActiveSwitchesTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetDashboardMostActiveEapsTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetDashboardOverviewTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetTrafficDistributionTool, category: 'dashboard', permission: 'read' },
    { fn: registerGetIspLoadTool, category: 'dashboard', permission: 'read' },
];

// ---------------------------------------------------------------------------
// registerAllTools — filters by active categories and permissions, then
// registers matching tools with the MCP server.
// ---------------------------------------------------------------------------

export function registerAllTools(server: McpServer, client: OmadaClient, activeCategories?: Map<ToolCategory, Set<ToolPermission>>): void {
    // If no filter map provided, register everything (backward-compat / tests)
    if (!activeCategories) {
        for (const entry of TOOL_REGISTRY) {
            entry.fn(server, client);
        }
        return;
    }

    // Deduplicate: some tools appear in multiple categories; track which fns we've already called.
    const registered = new Set<(server: McpServer, client: OmadaClient) => void>();

    let toolCount = 0;
    for (const entry of TOOL_REGISTRY) {
        const allowed = activeCategories.get(entry.category);
        if (!allowed) continue;
        if (!allowed.has(entry.permission)) continue;
        if (registered.has(entry.fn)) continue;

        registered.add(entry.fn);
        entry.fn(server, client);
        toolCount++;
    }

    // Startup log
    const categoryList = [...activeCategories.entries()]
        .map(([cat, perms]) => {
            const p = [...perms].sort().join('+');
            return `${cat}:${p}`;
        })
        .join(', ');

    logger.info('Tool categories loaded', {
        categories: categoryList,
        toolCount,
    });
}
