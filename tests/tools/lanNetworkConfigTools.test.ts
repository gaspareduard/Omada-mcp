import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAccessControlTool } from '../../src/tools/getAccessControl.js';
import { registerGetAlgTool } from '../../src/tools/getAlg.js';
import { registerGetBandwidthControlTool } from '../../src/tools/getBandwidthControl.js';
import { registerGetDdnsGridTool } from '../../src/tools/getDdnsGrid.js';
import { registerGetDhcpReservationGridTool } from '../../src/tools/getDhcpReservationGrid.js';
import { registerGetDnsCacheSettingTool } from '../../src/tools/getDnsCacheSetting.js';
import { registerGetDnsProxyTool } from '../../src/tools/getDnsProxy.js';
import { registerGetGridBandwidthCtrlRuleTool } from '../../src/tools/getGridBandwidthCtrlRule.js';
import { registerGetGridIpMacBindingTool } from '../../src/tools/getGridIpMacBinding.js';
import { registerGetGridOtoNatsTool } from '../../src/tools/getGridOtoNats.js';
import { registerGetGridPolicyRoutingTool } from '../../src/tools/getGridPolicyRouting.js';
import { registerGetGridSessionLimitRuleTool } from '../../src/tools/getGridSessionLimitRule.js';
import { registerGetGridVirtualWanTool } from '../../src/tools/getGridVirtualWan.js';
import { registerGetIgmpTool } from '../../src/tools/getIgmp.js';
import { registerGetInterfaceLanNetworkTool } from '../../src/tools/getInterfaceLanNetwork.js';
import { registerGetInterfaceLanNetworkV2Tool } from '../../src/tools/getInterfaceLanNetworkV2.js';
import { registerGetInternetTool } from '../../src/tools/getInternet.js';
import { registerGetInternetBasicPortInfoTool } from '../../src/tools/getInternetBasicPortInfo.js';
import { registerGetInternetLoadBalanceTool } from '../../src/tools/getInternetLoadBalance.js';
import { registerGetIpMacBindingGeneralSettingTool } from '../../src/tools/getIpMacBindingGeneralSetting.js';
import { registerGetLanNetworkListV2Tool } from '../../src/tools/getLanNetworkListV2.js';
import { registerGetLldpSettingTool } from '../../src/tools/getLldpSetting.js';
import { registerGetRemoteLoggingSettingTool } from '../../src/tools/getRemoteLoggingSetting.js';
import { registerGetSessionLimitTool } from '../../src/tools/getSessionLimit.js';
import { registerGetSnmpSettingTool } from '../../src/tools/getSnmpSetting.js';
import { registerGetStaticRoutingInterfaceListTool } from '../../src/tools/getStaticRoutingInterfaceList.js';
import { registerGetUpnpSettingTool } from '../../src/tools/getUpnpSetting.js';
import { registerGetWanPortsConfigTool } from '../../src/tools/getWanPortsConfig.js';
import { registerListPolicyRoutesTool } from '../../src/tools/listPolicyRoutes.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - LAN/network config tools (issue #38)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;
        mockClient = {
            getLanNetworkListV2: vi.fn().mockResolvedValue({ data: [] }),
            getInterfaceLanNetwork: vi.fn().mockResolvedValue({}),
            getInterfaceLanNetworkV2: vi.fn().mockResolvedValue({}),
            getGridPolicyRouting: vi.fn().mockResolvedValue({ data: [] }),
            getStaticRoutingInterfaceList: vi.fn().mockResolvedValue([]),
            getGridOtoNats: vi.fn().mockResolvedValue({ data: [] }),
            getAlg: vi.fn().mockResolvedValue({ sipEnabled: true }),
            getUpnpSetting: vi.fn().mockResolvedValue({ enabled: true }),
            getDdnsGrid: vi.fn().mockResolvedValue({ data: [] }),
            getDhcpReservationGrid: vi.fn().mockResolvedValue({ data: [] }),
            getGridIpMacBinding: vi.fn().mockResolvedValue({ data: [] }),
            getIpMacBindingGeneralSetting: vi.fn().mockResolvedValue({ enabled: false }),
            getSnmpSetting: vi.fn().mockResolvedValue({ version: 'v2c' }),
            getLldpSetting: vi.fn().mockResolvedValue({ enabled: true }),
            getRemoteLoggingSetting: vi.fn().mockResolvedValue({ server: '10.0.0.1' }),
            getSessionLimit: vi.fn().mockResolvedValue({ enabled: true }),
            getGridSessionLimitRule: vi.fn().mockResolvedValue({ data: [] }),
            getGridBandwidthCtrlRule: vi.fn().mockResolvedValue({ data: [] }),
            getAccessControl: vi.fn().mockResolvedValue({ allowedRanges: [] }),
            getDnsCacheSetting: vi.fn().mockResolvedValue({ enabled: true }),
            getDnsProxy: vi.fn().mockResolvedValue({ enabled: true }),
            getIgmp: vi.fn().mockResolvedValue({ snoopingEnabled: true }),
            getInternetLoadBalance: vi.fn().mockResolvedValue({ mode: 'loadBalance' }),
            getWanPortsConfig: vi.fn().mockResolvedValue({ ports: [] }),
            getInternetBasicPortInfo: vi.fn().mockResolvedValue({ wan1: 'connected' }),
            getInternet: vi.fn().mockResolvedValue({ connectionType: 'dhcp' }),
            getGridVirtualWan: vi.fn().mockResolvedValue({ data: [] }),
            listPolicyRoutes: vi.fn().mockResolvedValue([]),
            getBandwidthControl: vi.fn().mockResolvedValue({ enabled: true }),
        } as unknown as OmadaClient;

        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            /* noop */
        });
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            /* noop */
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('getLanNetworkListV2 - calls client with pagination', async () => {
        registerGetLanNetworkListV2Tool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getLanNetworkListV2).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getInterfaceLanNetwork - calls client with type', async () => {
        registerGetInterfaceLanNetworkTool(mockServer, mockClient);
        const result = await toolHandler({ type: 1 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getInterfaceLanNetwork).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it('getInterfaceLanNetworkV2 - calls client with type', async () => {
        registerGetInterfaceLanNetworkV2Tool(mockServer, mockClient);
        const result = await toolHandler({ type: 0 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getInterfaceLanNetworkV2).toHaveBeenCalledWith(0, undefined, undefined);
    });

    it('getGridPolicyRouting - calls client with pagination', async () => {
        registerGetGridPolicyRoutingTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridPolicyRouting).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getStaticRoutingInterfaceList - calls client', async () => {
        registerGetStaticRoutingInterfaceListTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getStaticRoutingInterfaceList).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getGridOtoNats - calls client with pagination', async () => {
        registerGetGridOtoNatsTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridOtoNats).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getAlg - calls client', async () => {
        registerGetAlgTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getAlg).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getUpnpSetting - calls client', async () => {
        registerGetUpnpSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getUpnpSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getDdnsGrid - calls client with pagination', async () => {
        registerGetDdnsGridTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getDdnsGrid).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getDhcpReservationGrid - calls client with pagination', async () => {
        registerGetDhcpReservationGridTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getDhcpReservationGrid).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getGridIpMacBinding - calls client with pagination', async () => {
        registerGetGridIpMacBindingTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridIpMacBinding).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getIpMacBindingGeneralSetting - calls client', async () => {
        registerGetIpMacBindingGeneralSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getIpMacBindingGeneralSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getSnmpSetting - calls client', async () => {
        registerGetSnmpSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getSnmpSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getLldpSetting - calls client', async () => {
        registerGetLldpSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getLldpSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getRemoteLoggingSetting - calls client', async () => {
        registerGetRemoteLoggingSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getRemoteLoggingSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getSessionLimit - calls client', async () => {
        registerGetSessionLimitTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getSessionLimit).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getGridSessionLimitRule - calls client with pagination', async () => {
        registerGetGridSessionLimitRuleTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridSessionLimitRule).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getGridBandwidthCtrlRule - calls client with pagination', async () => {
        registerGetGridBandwidthCtrlRuleTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridBandwidthCtrlRule).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getAccessControl - calls client', async () => {
        registerGetAccessControlTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getAccessControl).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getDnsCacheSetting - calls client', async () => {
        registerGetDnsCacheSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDnsCacheSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getDnsProxy - calls client', async () => {
        registerGetDnsProxyTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getDnsProxy).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getIgmp - calls client', async () => {
        registerGetIgmpTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getIgmp).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getInternetLoadBalance - calls client', async () => {
        registerGetInternetLoadBalanceTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getInternetLoadBalance).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getWanPortsConfig - calls client', async () => {
        registerGetWanPortsConfigTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getWanPortsConfig).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getInternetBasicPortInfo - calls client', async () => {
        registerGetInternetBasicPortInfoTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getInternetBasicPortInfo).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getInternet - calls client', async () => {
        registerGetInternetTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getInternet).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getGridVirtualWan - calls client with pagination', async () => {
        registerGetGridVirtualWanTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridVirtualWan).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('listPolicyRoutes - calls client', async () => {
        registerListPolicyRoutesTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listPolicyRoutes).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getBandwidthControl - calls client', async () => {
        registerGetBandwidthControlTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getBandwidthControl).toHaveBeenCalledWith(undefined, undefined);
    });
});
