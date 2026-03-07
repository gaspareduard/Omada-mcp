import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAuditLogSettingForGlobalTool } from '../../src/tools/getAuditLogSettingForGlobal.js';
import { registerGetAuditLogSettingForSiteTool } from '../../src/tools/getAuditLogSettingForSite.js';
import { registerGetAuditLogsForGlobalTool } from '../../src/tools/getAuditLogsForGlobal.js';
import { registerGetLogSettingForGlobalTool } from '../../src/tools/getLogSettingForGlobal.js';
import { registerGetLogSettingForGlobalV2Tool } from '../../src/tools/getLogSettingForGlobalV2.js';
import { registerGetLogSettingForSiteTool } from '../../src/tools/getLogSettingForSite.js';
import { registerGetLogSettingForSiteV2Tool } from '../../src/tools/getLogSettingForSiteV2.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - Logs, Events & Alerts tools (issue #42)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler!: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;
        mockClient = {
            getLogSettingForSite: vi.fn().mockResolvedValue({}),
            getLogSettingForSiteV2: vi.fn().mockResolvedValue({}),
            getAuditLogSettingForSite: vi.fn().mockResolvedValue({}),
            getLogSettingForGlobal: vi.fn().mockResolvedValue({}),
            getLogSettingForGlobalV2: vi.fn().mockResolvedValue({}),
            getAuditLogSettingForGlobal: vi.fn().mockResolvedValue({}),
            getAuditLogsForGlobal: vi.fn().mockResolvedValue({ data: [] }),
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

    it('getLogSettingForSite calls client', async () => {
        registerGetLogSettingForSiteTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getLogSettingForSite).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getLogSettingForSiteV2 calls client', async () => {
        registerGetLogSettingForSiteV2Tool(mockServer, mockClient);
        const result = await toolHandler({ siteId: 'site-1' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getLogSettingForSiteV2).toHaveBeenCalledWith('site-1', undefined);
    });

    it('getAuditLogSettingForSite calls client', async () => {
        registerGetAuditLogSettingForSiteTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getAuditLogSettingForSite).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getLogSettingForGlobal calls client', async () => {
        registerGetLogSettingForGlobalTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getLogSettingForGlobal).toHaveBeenCalledWith(undefined);
    });

    it('getLogSettingForGlobalV2 calls client', async () => {
        registerGetLogSettingForGlobalV2Tool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getLogSettingForGlobalV2).toHaveBeenCalledWith(undefined);
    });

    it('getAuditLogSettingForGlobal calls client', async () => {
        registerGetAuditLogSettingForGlobalTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getAuditLogSettingForGlobal).toHaveBeenCalledWith(undefined);
    });

    it('getAuditLogsForGlobal calls client with pagination', async () => {
        registerGetAuditLogsForGlobalTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getAuditLogsForGlobal).toHaveBeenCalledWith(
            1,
            10,
            {
                sortTime: undefined,
                filterResult: undefined,
                filterLevel: undefined,
                filterAuditTypes: undefined,
                filterTimes: undefined,
                searchKey: undefined,
            },
            undefined
        );
    });

    it('getAuditLogsForGlobal passes optional filters', async () => {
        registerGetAuditLogsForGlobalTool(mockServer, mockClient);
        await toolHandler({ page: 1, pageSize: 10, sortTime: 'desc', filterLevel: 'warning', searchKey: 'admin' }, {});
        expect(mockClient.getAuditLogsForGlobal).toHaveBeenCalledWith(
            1,
            10,
            {
                sortTime: 'desc',
                filterResult: undefined,
                filterLevel: 'warning',
                filterAuditTypes: undefined,
                filterTimes: undefined,
                searchKey: 'admin',
            },
            undefined
        );
    });
});
