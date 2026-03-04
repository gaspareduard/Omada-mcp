import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetApDetailTool } from '../../src/tools/getApDetail.js';
import { registerGetApplicationControlStatusTool } from '../../src/tools/getApplicationControlStatus.js';
import { registerGetApRadiosTool } from '../../src/tools/getApRadios.js';
import { registerGetDashboardMostActiveEapsTool } from '../../src/tools/getDashboardMostActiveEaps.js';
import { registerGetDashboardMostActiveSwitchesTool } from '../../src/tools/getDashboardMostActiveSwitches.js';
import { registerGetDashboardOverviewTool } from '../../src/tools/getDashboardOverview.js';
import { registerGetDashboardPoEUsageTool } from '../../src/tools/getDashboardPoEUsage.js';
import { registerGetDashboardSwitchSummaryTool } from '../../src/tools/getDashboardSwitchSummary.js';
import { registerGetDashboardTopCpuUsageTool } from '../../src/tools/getDashboardTopCpuUsage.js';
import { registerGetDashboardTopMemoryUsageTool } from '../../src/tools/getDashboardTopMemoryUsage.js';
import { registerGetDashboardTrafficActivitiesTool } from '../../src/tools/getDashboardTrafficActivities.js';
import { registerGetDashboardWifiSummaryTool } from '../../src/tools/getDashboardWifiSummary.js';
import { registerGetGatewayDetailTool } from '../../src/tools/getGatewayDetail.js';
import { registerGetGatewayLanStatusTool } from '../../src/tools/getGatewayLanStatus.js';
import { registerGetGatewayPortsTool } from '../../src/tools/getGatewayPorts.js';
import { registerGetGatewayWanStatusTool } from '../../src/tools/getGatewayWanStatus.js';
import { registerGetRogueApsTool } from '../../src/tools/getRogueAps.js';
import { registerGetSshSettingTool } from '../../src/tools/getSshSetting.js';
import { registerGetStackPortsTool } from '../../src/tools/getStackPorts.js';
import { registerGetSwitchDetailTool } from '../../src/tools/getSwitchDetail.js';
import { registerGetTopThreatsTool } from '../../src/tools/getTopThreats.js';
import { registerGetVpnSettingsTool } from '../../src/tools/getVpnSettings.js';
import { registerGetVpnTunnelStatsTool } from '../../src/tools/getVpnTunnelStats.js';
import { registerGetWanLanStatusTool } from '../../src/tools/getWanLanStatus.js';
import { registerGetWidsTool } from '../../src/tools/getWids.js';
import { registerListAllSsidsTool } from '../../src/tools/listAllSsids.js';
import { registerListEapAclsTool } from '../../src/tools/listEapAcls.js';
import { registerListGlobalAlertsTool } from '../../src/tools/listGlobalAlerts.js';
import { registerListGlobalEventsTool } from '../../src/tools/listGlobalEvents.js';
import { registerListGroupProfilesTool } from '../../src/tools/listGroupProfiles.js';
import { registerListOsgAclsTool } from '../../src/tools/listOsgAcls.js';
import { registerListPendingDevicesTool } from '../../src/tools/listPendingDevices.js';
import { registerListPortForwardingRulesTool } from '../../src/tools/listPortForwardingRules.js';
import { registerListRadiusProfilesTool } from '../../src/tools/listRadiusProfiles.js';
import { registerListSiteAlertsTool } from '../../src/tools/listSiteAlerts.js';
import { registerListSiteAuditLogsTool } from '../../src/tools/listSiteAuditLogs.js';
import { registerListSiteEventsTool } from '../../src/tools/listSiteEvents.js';
import { registerListSiteThreatManagementTool } from '../../src/tools/listSiteThreatManagement.js';
import { registerListSiteToSiteVpnsTool } from '../../src/tools/listSiteToSiteVpns.js';
import { registerListStaticRoutesTool } from '../../src/tools/listStaticRoutes.js';
import { registerListTimeRangeProfilesTool } from '../../src/tools/listTimeRangeProfiles.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - new GET operations', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn(captureHandler),
        } as unknown as McpServer;

        mockClient = {
            getApDetail: vi.fn().mockResolvedValue({ mac: 'aa:bb' }),
            getApRadios: vi.fn().mockResolvedValue([]),
            getApplicationControlStatus: vi.fn().mockResolvedValue({ enabled: true }),
            getDashboardMostActiveEaps: vi.fn().mockResolvedValue([]),
            getDashboardMostActiveSwitches: vi.fn().mockResolvedValue([]),
            getDashboardOverview: vi.fn().mockResolvedValue({}),
            getDashboardPoEUsage: vi.fn().mockResolvedValue([]),
            getDashboardSwitchSummary: vi.fn().mockResolvedValue({}),
            getDashboardTopCpuUsage: vi.fn().mockResolvedValue([]),
            getDashboardTopMemoryUsage: vi.fn().mockResolvedValue([]),
            getDashboardTrafficActivities: vi.fn().mockResolvedValue({}),
            getDashboardWifiSummary: vi.fn().mockResolvedValue({}),
            getGatewayDetail: vi.fn().mockResolvedValue({ mac: 'aa:bb' }),
            getGatewayLanStatus: vi.fn().mockResolvedValue({}),
            getGatewayPorts: vi.fn().mockResolvedValue([]),
            getGatewayWanStatus: vi.fn().mockResolvedValue({}),
            getRogueAps: vi.fn().mockResolvedValue([]),
            getSshSetting: vi.fn().mockResolvedValue({ enabled: false }),
            getStackPorts: vi.fn().mockResolvedValue([]),
            getSwitchDetail: vi.fn().mockResolvedValue({ mac: 'aa:bb' }),
            getTopThreats: vi.fn().mockResolvedValue([]),
            getVpnSettings: vi.fn().mockResolvedValue({}),
            getVpnTunnelStats: vi.fn().mockResolvedValue({}),
            getWanLanStatus: vi.fn().mockResolvedValue({}),
            getWids: vi.fn().mockResolvedValue({}),
            listAllSsids: vi.fn().mockResolvedValue([]),
            listEapAcls: vi.fn().mockResolvedValue([]),
            listGlobalAlerts: vi.fn().mockResolvedValue({ data: [], totalRows: 0, currentPage: 1, currentSize: 0 }),
            listGlobalEvents: vi.fn().mockResolvedValue({ data: [], totalRows: 0, currentPage: 1, currentSize: 0 }),
            listGroupProfiles: vi.fn().mockResolvedValue([]),
            listOsgAcls: vi.fn().mockResolvedValue([]),
            listPendingDevices: vi.fn().mockResolvedValue([]),
            listPortForwardingRules: vi.fn().mockResolvedValue([]),
            listRadiusProfiles: vi.fn().mockResolvedValue([]),
            listSiteAlerts: vi.fn().mockResolvedValue({ data: [], totalRows: 0, currentPage: 1, currentSize: 0 }),
            listSiteAuditLogs: vi.fn().mockResolvedValue({ data: [], totalRows: 0, currentPage: 1, currentSize: 0 }),
            listSiteEvents: vi.fn().mockResolvedValue({ data: [], totalRows: 0, currentPage: 1, currentSize: 0 }),
            listSiteThreatManagement: vi.fn().mockResolvedValue({ data: [], totalRows: 0, currentPage: 1, currentSize: 0 }),
            listSiteToSiteVpns: vi.fn().mockResolvedValue([]),
            listStaticRoutes: vi.fn().mockResolvedValue([]),
            listTimeRangeProfiles: vi.fn().mockResolvedValue([]),
        } as unknown as OmadaClient;

        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            // noop
        });
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            // noop
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('getApDetail handler executes successfully', async () => {
        registerGetApDetailTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA:BB:CC:DD:EE:FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getApDetail).toHaveBeenCalled();
    });

    it('getApRadios handler executes successfully', async () => {
        registerGetApRadiosTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA:BB:CC:DD:EE:FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getApRadios).toHaveBeenCalled();
    });

    it('getApplicationControlStatus handler executes successfully', async () => {
        registerGetApplicationControlStatusTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getApplicationControlStatus).toHaveBeenCalled();
    });

    it('getDashboardMostActiveEaps handler executes successfully', async () => {
        registerGetDashboardMostActiveEapsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardMostActiveEaps).toHaveBeenCalled();
    });

    it('getDashboardMostActiveSwitches handler executes successfully', async () => {
        registerGetDashboardMostActiveSwitchesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardMostActiveSwitches).toHaveBeenCalled();
    });

    it('getDashboardOverview handler executes successfully', async () => {
        registerGetDashboardOverviewTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardOverview).toHaveBeenCalled();
    });

    it('getDashboardPoEUsage handler executes successfully', async () => {
        registerGetDashboardPoEUsageTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardPoEUsage).toHaveBeenCalled();
    });

    it('getDashboardSwitchSummary handler executes successfully', async () => {
        registerGetDashboardSwitchSummaryTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardSwitchSummary).toHaveBeenCalled();
    });

    it('getDashboardTopCpuUsage handler executes successfully', async () => {
        registerGetDashboardTopCpuUsageTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardTopCpuUsage).toHaveBeenCalled();
    });

    it('getDashboardTopMemoryUsage handler executes successfully', async () => {
        registerGetDashboardTopMemoryUsageTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardTopMemoryUsage).toHaveBeenCalled();
    });

    it('getDashboardTrafficActivities handler executes successfully', async () => {
        registerGetDashboardTrafficActivitiesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardTrafficActivities).toHaveBeenCalled();
    });

    it('getDashboardWifiSummary handler executes successfully', async () => {
        registerGetDashboardWifiSummaryTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDashboardWifiSummary).toHaveBeenCalled();
    });

    it('getGatewayDetail handler executes successfully', async () => {
        registerGetGatewayDetailTool(mockServer, mockClient);
        const result = await toolHandler({ gatewayMac: 'AA:BB:CC:DD:EE:FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGatewayDetail).toHaveBeenCalled();
    });

    it('getGatewayLanStatus handler executes successfully', async () => {
        registerGetGatewayLanStatusTool(mockServer, mockClient);
        const result = await toolHandler({ gatewayMac: 'AA:BB:CC:DD:EE:FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGatewayLanStatus).toHaveBeenCalled();
    });

    it('getGatewayPorts handler executes successfully', async () => {
        registerGetGatewayPortsTool(mockServer, mockClient);
        const result = await toolHandler({ gatewayMac: 'AA:BB:CC:DD:EE:FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGatewayPorts).toHaveBeenCalled();
    });

    it('getGatewayWanStatus handler executes successfully', async () => {
        registerGetGatewayWanStatusTool(mockServer, mockClient);
        const result = await toolHandler({ gatewayMac: 'AA:BB:CC:DD:EE:FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGatewayWanStatus).toHaveBeenCalled();
    });

    it('getRogueAps handler executes successfully', async () => {
        registerGetRogueApsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getRogueAps).toHaveBeenCalled();
    });

    it('getSshSetting handler executes successfully', async () => {
        registerGetSshSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getSshSetting).toHaveBeenCalled();
    });

    it('getStackPorts handler executes successfully', async () => {
        registerGetStackPortsTool(mockServer, mockClient);
        const result = await toolHandler({ stackId: 'stack-1' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getStackPorts).toHaveBeenCalled();
    });

    it('getSwitchDetail handler executes successfully', async () => {
        registerGetSwitchDetailTool(mockServer, mockClient);
        const result = await toolHandler({ switchMac: 'AA:BB:CC:DD:EE:FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getSwitchDetail).toHaveBeenCalled();
    });

    it('getTopThreats handler executes successfully', async () => {
        registerGetTopThreatsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getTopThreats).toHaveBeenCalled();
    });

    it('getVpnSettings handler executes successfully', async () => {
        registerGetVpnSettingsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getVpnSettings).toHaveBeenCalled();
    });

    it('getVpnTunnelStats handler executes successfully', async () => {
        registerGetVpnTunnelStatsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getVpnTunnelStats).toHaveBeenCalled();
    });

    it('getWanLanStatus handler executes successfully', async () => {
        registerGetWanLanStatusTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getWanLanStatus).toHaveBeenCalled();
    });

    it('getWids handler executes successfully', async () => {
        registerGetWidsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getWids).toHaveBeenCalled();
    });

    it('listAllSsids handler executes successfully', async () => {
        registerListAllSsidsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listAllSsids).toHaveBeenCalled();
    });

    it('listEapAcls handler executes successfully', async () => {
        registerListEapAclsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listEapAcls).toHaveBeenCalled();
    });

    it('listGlobalAlerts handler executes successfully', async () => {
        registerListGlobalAlertsTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listGlobalAlerts).toHaveBeenCalled();
    });

    it('listGlobalEvents handler executes successfully', async () => {
        registerListGlobalEventsTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listGlobalEvents).toHaveBeenCalled();
    });

    it('listGroupProfiles handler executes successfully', async () => {
        registerListGroupProfilesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listGroupProfiles).toHaveBeenCalled();
    });

    it('listOsgAcls handler executes successfully', async () => {
        registerListOsgAclsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listOsgAcls).toHaveBeenCalled();
    });

    it('listPendingDevices handler executes successfully', async () => {
        registerListPendingDevicesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listPendingDevices).toHaveBeenCalled();
    });

    it('listPortForwardingRules handler executes successfully', async () => {
        registerListPortForwardingRulesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listPortForwardingRules).toHaveBeenCalled();
    });

    it('listRadiusProfiles handler executes successfully', async () => {
        registerListRadiusProfilesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listRadiusProfiles).toHaveBeenCalled();
    });

    it('listSiteAlerts handler executes successfully', async () => {
        registerListSiteAlertsTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listSiteAlerts).toHaveBeenCalled();
    });

    it('listSiteAuditLogs handler executes successfully', async () => {
        registerListSiteAuditLogsTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listSiteAuditLogs).toHaveBeenCalled();
    });

    it('listSiteEvents handler executes successfully', async () => {
        registerListSiteEventsTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listSiteEvents).toHaveBeenCalled();
    });

    it('listSiteThreatManagement handler executes successfully', async () => {
        registerListSiteThreatManagementTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listSiteThreatManagement).toHaveBeenCalled();
    });

    it('listSiteToSiteVpns handler executes successfully', async () => {
        registerListSiteToSiteVpnsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listSiteToSiteVpns).toHaveBeenCalled();
    });

    it('listStaticRoutes handler executes successfully', async () => {
        registerListStaticRoutesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listStaticRoutes).toHaveBeenCalled();
    });

    it('listTimeRangeProfiles handler executes successfully', async () => {
        registerListTimeRangeProfilesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listTimeRangeProfiles).toHaveBeenCalled();
    });
});
