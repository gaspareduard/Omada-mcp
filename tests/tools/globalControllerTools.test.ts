import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientActiveTimeoutTool } from '../../src/tools/getClientActiveTimeout.js';
import { registerGetControllerStatusTool } from '../../src/tools/getControllerStatus.js';
import { registerGetDeviceAccessManagementTool } from '../../src/tools/getDeviceAccessManagement.js';
import { registerGetGeneralSettingsTool } from '../../src/tools/getGeneralSettings.js';
import { registerGetLoggingTool } from '../../src/tools/getLogging.js';
import { registerGetMailServerStatusTool } from '../../src/tools/getMailServerStatus.js';
import { registerGetRadiusServerTool } from '../../src/tools/getRadiusServer.js';
import { registerGetRemoteLoggingTool } from '../../src/tools/getRemoteLogging.js';
import { registerGetRetentionTool } from '../../src/tools/getRetention.js';
import { registerGetUiInterfaceTool } from '../../src/tools/getUiInterface.js';
import { registerGetWebhookForGlobalTool } from '../../src/tools/getWebhookForGlobal.js';
import { registerGetWebhookLogsForGlobalTool } from '../../src/tools/getWebhookLogsForGlobal.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - Global Controller settings (issue #41)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler!: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;
        mockClient = {
            getControllerStatus: vi.fn().mockResolvedValue({}),
            getGeneralSettings: vi.fn().mockResolvedValue({}),
            getRetention: vi.fn().mockResolvedValue({}),
            getClientActiveTimeout: vi.fn().mockResolvedValue({}),
            getRemoteLogging: vi.fn().mockResolvedValue({}),
            getRadiusServer: vi.fn().mockResolvedValue({}),
            getLogging: vi.fn().mockResolvedValue({}),
            getUiInterface: vi.fn().mockResolvedValue({}),
            getDeviceAccessManagement: vi.fn().mockResolvedValue({}),
            getWebhookForGlobal: vi.fn().mockResolvedValue({}),
            getWebhookLogsForGlobal: vi.fn().mockResolvedValue({ data: [] }),
            getMailServerStatus: vi.fn().mockResolvedValue({}),
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

    it('getControllerStatus calls client', async () => {
        registerGetControllerStatusTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getControllerStatus).toHaveBeenCalledWith(undefined);
    });

    it('getGeneralSettings calls client', async () => {
        registerGetGeneralSettingsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getGeneralSettings).toHaveBeenCalledWith(undefined);
    });

    it('getRetention calls client', async () => {
        registerGetRetentionTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getRetention).toHaveBeenCalledWith(undefined);
    });

    it('getClientActiveTimeout calls client', async () => {
        registerGetClientActiveTimeoutTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getClientActiveTimeout).toHaveBeenCalledWith(undefined);
    });

    it('getRemoteLogging calls client', async () => {
        registerGetRemoteLoggingTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getRemoteLogging).toHaveBeenCalledWith(undefined);
    });

    it('getRadiusServer calls client', async () => {
        registerGetRadiusServerTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getRadiusServer).toHaveBeenCalledWith(undefined);
    });

    it('getLogging calls client', async () => {
        registerGetLoggingTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getLogging).toHaveBeenCalledWith(undefined);
    });

    it('getUiInterface calls client', async () => {
        registerGetUiInterfaceTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getUiInterface).toHaveBeenCalledWith(undefined);
    });

    it('getDeviceAccessManagement calls client', async () => {
        registerGetDeviceAccessManagementTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getDeviceAccessManagement).toHaveBeenCalledWith(undefined);
    });

    it('getWebhookForGlobal calls client', async () => {
        registerGetWebhookForGlobalTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getWebhookForGlobal).toHaveBeenCalledWith(undefined);
    });

    it('getWebhookLogsForGlobal calls client with required params', async () => {
        registerGetWebhookLogsForGlobalTool(mockServer, mockClient);
        const result = await toolHandler({ webhookId: 'wh-1', timeStart: 1700000000000, timeEnd: 1700086400000 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getWebhookLogsForGlobal).toHaveBeenCalledWith(1, 10, 'wh-1', 1700000000000, 1700086400000, undefined);
    });

    it('getMailServerStatus calls client', async () => {
        registerGetMailServerStatusTool(mockServer, mockClient);
        expect(await toolHandler({}, {})).toBeDefined();
        expect(mockClient.getMailServerStatus).toHaveBeenCalledWith(undefined);
    });
});
