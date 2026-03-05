import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetBandSteeringSettingTool } from '../../src/tools/getBandSteeringSetting.js';
import { registerGetBeaconControlSettingTool } from '../../src/tools/getBeaconControlSetting.js';
import { registerGetChannelLimitSettingTool } from '../../src/tools/getChannelLimitSetting.js';
import { registerGetEapDot1xSettingTool } from '../../src/tools/getEapDot1xSetting.js';
import { registerGetGridAllowMacFilteringTool } from '../../src/tools/getGridAllowMacFiltering.js';
import { registerGetGridDenyMacFilteringTool } from '../../src/tools/getGridDenyMacFiltering.js';
import { registerGetMacAuthSettingTool } from '../../src/tools/getMacAuthSetting.js';
import { registerGetMacAuthSsidsTool } from '../../src/tools/getMacAuthSsids.js';
import { registerGetMacFilteringGeneralSettingTool } from '../../src/tools/getMacFilteringGeneralSetting.js';
import { registerGetMeshSettingTool } from '../../src/tools/getMeshSetting.js';
import { registerGetOuiProfileListTool } from '../../src/tools/getOuiProfileList.js';
import { registerGetRadioFrequencyPlanningConfigTool } from '../../src/tools/getRadioFrequencyPlanningConfig.js';
import { registerGetRadioFrequencyPlanningResultTool } from '../../src/tools/getRadioFrequencyPlanningResult.js';
import { registerGetRoamingSettingTool } from '../../src/tools/getRoamingSetting.js';
import { registerGetSsidsBySiteTool } from '../../src/tools/getSsidsBySite.js';
import { registerGetSwitchDot1xSettingTool } from '../../src/tools/getSwitchDot1xSetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - wireless/SSID tools (issue #35)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;
        mockClient = {
            getSsidsBySite: vi.fn().mockResolvedValue([]),
            getRadioFrequencyPlanningConfig: vi.fn().mockResolvedValue({}),
            getRadioFrequencyPlanningResult: vi.fn().mockResolvedValue({}),
            getBandSteeringSetting: vi.fn().mockResolvedValue({}),
            getBeaconControlSetting: vi.fn().mockResolvedValue({}),
            getChannelLimitSetting: vi.fn().mockResolvedValue({}),
            getMeshSetting: vi.fn().mockResolvedValue({}),
            getRoamingSetting: vi.fn().mockResolvedValue({}),
            getOuiProfileList: vi.fn().mockResolvedValue({ data: [], totalRows: 0 }),
            getMacAuthSetting: vi.fn().mockResolvedValue({}),
            getMacAuthSsids: vi.fn().mockResolvedValue([]),
            getMacFilteringGeneralSetting: vi.fn().mockResolvedValue({}),
            getGridAllowMacFiltering: vi.fn().mockResolvedValue({ data: [], totalRows: 0 }),
            getGridDenyMacFiltering: vi.fn().mockResolvedValue({ data: [], totalRows: 0 }),
            getSwitchDot1xSetting: vi.fn().mockResolvedValue({}),
            getEapDot1xSetting: vi.fn().mockResolvedValue({}),
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

    it('getSsidsBySite calls client with type param', async () => {
        registerGetSsidsBySiteTool(mockServer, mockClient);
        const result = await toolHandler({ type: 1 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getSsidsBySite).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it('getSsidsBySite passes siteId', async () => {
        registerGetSsidsBySiteTool(mockServer, mockClient);
        await toolHandler({ type: 3, siteId: 'site-1' }, {});
        expect(mockClient.getSsidsBySite).toHaveBeenCalledWith(3, 'site-1', undefined);
    });

    it('getRadioFrequencyPlanningConfig calls client', async () => {
        registerGetRadioFrequencyPlanningConfigTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getRadioFrequencyPlanningConfig).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getRadioFrequencyPlanningResult calls client', async () => {
        registerGetRadioFrequencyPlanningResultTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getRadioFrequencyPlanningResult).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getBandSteeringSetting calls client', async () => {
        registerGetBandSteeringSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getBandSteeringSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getBeaconControlSetting calls client', async () => {
        registerGetBeaconControlSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getBeaconControlSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getChannelLimitSetting calls client', async () => {
        registerGetChannelLimitSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getChannelLimitSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getMeshSetting calls client', async () => {
        registerGetMeshSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getMeshSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getRoamingSetting calls client', async () => {
        registerGetRoamingSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getRoamingSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getOuiProfileList calls client with pagination', async () => {
        registerGetOuiProfileListTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getOuiProfileList).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getMacAuthSetting calls client', async () => {
        registerGetMacAuthSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getMacAuthSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getMacAuthSsids calls client', async () => {
        registerGetMacAuthSsidsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getMacAuthSsids).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getMacFilteringGeneralSetting calls client', async () => {
        registerGetMacFilteringGeneralSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getMacFilteringGeneralSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getGridAllowMacFiltering calls client with pagination', async () => {
        registerGetGridAllowMacFilteringTool(mockServer, mockClient);
        const result = await toolHandler({ page: 2, pageSize: 20 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridAllowMacFiltering).toHaveBeenCalledWith(2, 20, undefined, undefined);
    });

    it('getGridDenyMacFiltering calls client with pagination', async () => {
        registerGetGridDenyMacFilteringTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 50 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridDenyMacFiltering).toHaveBeenCalledWith(1, 50, undefined, undefined);
    });

    it('getSwitchDot1xSetting calls client', async () => {
        registerGetSwitchDot1xSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getSwitchDot1xSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getEapDot1xSetting calls client', async () => {
        registerGetEapDot1xSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getEapDot1xSetting).toHaveBeenCalledWith(undefined, undefined);
    });
});
