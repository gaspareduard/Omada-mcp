import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAllDeviceBySiteTool } from '../../src/tools/getAllDeviceBySite.js';
import { registerGetApGeneralConfigTool } from '../../src/tools/getApGeneralConfig.js';
import { registerGetApLldpConfigTool } from '../../src/tools/getApLldpConfig.js';
import { registerGetApSnmpConfigTool } from '../../src/tools/getApSnmpConfig.js';
import { registerGetApUplinkConfigTool } from '../../src/tools/getApUplinkConfig.js';
import { registerGetApVlanConfigTool } from '../../src/tools/getApVlanConfig.js';
import { registerGetCableTestFullResultsTool } from '../../src/tools/getCableTestFullResults.js';
import { registerGetCableTestLogsTool } from '../../src/tools/getCableTestLogs.js';
import { registerGetDownlinkWiredDevicesTool } from '../../src/tools/getDownlinkWiredDevices.js';
import { registerGetFirmwareInfoTool } from '../../src/tools/getFirmwareInfo.js';
import { registerGetGridAutoCheckUpgradeTool } from '../../src/tools/getGridAutoCheckUpgrade.js';
import { registerGetMeshStatisticsTool } from '../../src/tools/getMeshStatistics.js';
import { registerGetOswStackLagListTool } from '../../src/tools/getOswStackLagList.js';
import { registerGetRadiosConfigTool } from '../../src/tools/getRadiosConfig.js';
import { registerGetRFScanResultTool } from '../../src/tools/getRFScanResult.js';
import { registerGetSpeedTestResultsTool } from '../../src/tools/getSpeedTestResults.js';
import { registerGetStackNetworkListTool } from '../../src/tools/getStackNetworkList.js';
import { registerGetSwitchGeneralConfigTool } from '../../src/tools/getSwitchGeneralConfig.js';
import { registerGetUplinkWiredDetailTool } from '../../src/tools/getUplinkWiredDetail.js';
import { registerListSwitchNetworksTool } from '../../src/tools/listSwitchNetworks.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - device management tools (issue #36)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;

        mockClient = {
            getAllDeviceBySite: vi.fn().mockResolvedValue([]),
            getFirmwareInfo: vi.fn().mockResolvedValue({ latestFirmware: '1.0' }),
            getGridAutoCheckUpgrade: vi.fn().mockResolvedValue({ data: [] }),
            listSwitchNetworks: vi.fn().mockResolvedValue({ data: [] }),
            getSwitchGeneralConfig: vi.fn().mockResolvedValue({ ledEnabled: true }),
            getCableTestLogs: vi.fn().mockResolvedValue({ logs: [] }),
            getCableTestFullResults: vi.fn().mockResolvedValue({ ports: [] }),
            getOswStackLagList: vi.fn().mockResolvedValue([]),
            getStackNetworkList: vi.fn().mockResolvedValue({ data: [] }),
            getApUplinkConfig: vi.fn().mockResolvedValue({ uplinkMode: 1 }),
            getRadiosConfig: vi.fn().mockResolvedValue({ radios: [] }),
            getApVlanConfig: vi.fn().mockResolvedValue({ managementVlan: 10 }),
            getMeshStatistics: vi.fn().mockResolvedValue({ linkQuality: 90 }),
            getRFScanResult: vi.fn().mockResolvedValue({ channels: [] }),
            getSpeedTestResults: vi.fn().mockResolvedValue({ download: 500 }),
            getApSnmpConfig: vi.fn().mockResolvedValue({ snmpEnabled: true }),
            getApLldpConfig: vi.fn().mockResolvedValue({ lldpEnabled: true }),
            getApGeneralConfig: vi.fn().mockResolvedValue({ deviceName: 'AP-1' }),
            getUplinkWiredDetail: vi.fn().mockResolvedValue({ port: 3 }),
            getDownlinkWiredDevices: vi.fn().mockResolvedValue([]),
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

    it('getAllDeviceBySite - calls client and returns result', async () => {
        registerGetAllDeviceBySiteTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getAllDeviceBySite).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getFirmwareInfo - calls client with deviceMac', async () => {
        registerGetFirmwareInfoTool(mockServer, mockClient);
        const result = await toolHandler({ deviceMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getFirmwareInfo).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getGridAutoCheckUpgrade - calls client with pagination', async () => {
        registerGetGridAutoCheckUpgradeTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridAutoCheckUpgrade).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('listSwitchNetworks - calls client with switchMac and pagination', async () => {
        registerListSwitchNetworksTool(mockServer, mockClient);
        const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF', page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listSwitchNetworks).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 1, 10, undefined, undefined);
    });

    it('getSwitchGeneralConfig - calls client with switchMac', async () => {
        registerGetSwitchGeneralConfigTool(mockServer, mockClient);
        const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getSwitchGeneralConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getCableTestLogs - calls client with switchMac', async () => {
        registerGetCableTestLogsTool(mockServer, mockClient);
        const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getCableTestLogs).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getCableTestFullResults - calls client with switchMac', async () => {
        registerGetCableTestFullResultsTool(mockServer, mockClient);
        const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getCableTestFullResults).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getOswStackLagList - calls client with stackId', async () => {
        registerGetOswStackLagListTool(mockServer, mockClient);
        const result = await toolHandler({ stackId: 'stack-1' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getOswStackLagList).toHaveBeenCalledWith('stack-1', undefined, undefined);
    });

    it('getStackNetworkList - calls client with stackId and pagination', async () => {
        registerGetStackNetworkListTool(mockServer, mockClient);
        const result = await toolHandler({ stackId: 'stack-1', page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getStackNetworkList).toHaveBeenCalledWith('stack-1', 1, 10, undefined, undefined);
    });

    it('getApUplinkConfig - calls client with apMac', async () => {
        registerGetApUplinkConfigTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getApUplinkConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getRadiosConfig - calls client with apMac', async () => {
        registerGetRadiosConfigTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getRadiosConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getApVlanConfig - calls client with apMac', async () => {
        registerGetApVlanConfigTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getApVlanConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getMeshStatistics - calls client with apMac', async () => {
        registerGetMeshStatisticsTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getMeshStatistics).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getRFScanResult - calls client with apMac', async () => {
        registerGetRFScanResultTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getRFScanResult).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getSpeedTestResults - calls client with apMac', async () => {
        registerGetSpeedTestResultsTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getSpeedTestResults).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getApSnmpConfig - calls client with apMac', async () => {
        registerGetApSnmpConfigTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getApSnmpConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getApLldpConfig - calls client with apMac', async () => {
        registerGetApLldpConfigTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getApLldpConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getApGeneralConfig - calls client with apMac', async () => {
        registerGetApGeneralConfigTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getApGeneralConfig).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getUplinkWiredDetail - calls client with apMac', async () => {
        registerGetUplinkWiredDetailTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getUplinkWiredDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });

    it('getDownlinkWiredDevices - calls client with apMac', async () => {
        registerGetDownlinkWiredDevicesTool(mockServer, mockClient);
        const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getDownlinkWiredDevices).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
    });
});
