import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGroupProfilesByTypeTool } from '../../src/tools/getGroupProfilesByType.js';
import { registerGetLdapProfileListTool } from '../../src/tools/getLdapProfileList.js';
import { registerGetPPSKProfilesTool } from '../../src/tools/getPPSKProfiles.js';
import { registerGetRadiusUserListTool } from '../../src/tools/getRadiusUserList.js';
import { registerGetServiceTypeSummaryTool } from '../../src/tools/getServiceTypeSummary.js';
import { registerListMdnsProfileTool } from '../../src/tools/listMdnsProfile.js';
import { registerListServiceTypeTool } from '../../src/tools/listServiceType.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - Profiles & Policies tools (issue #40)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler!: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;
        mockClient = {
            listServiceType: vi.fn().mockResolvedValue({ data: [] }),
            getServiceTypeSummary: vi.fn().mockResolvedValue({}),
            getGroupProfilesByType: vi.fn().mockResolvedValue({ data: [] }),
            getLdapProfileList: vi.fn().mockResolvedValue([]),
            getRadiusUserList: vi.fn().mockResolvedValue({ data: [] }),
            getPPSKProfiles: vi.fn().mockResolvedValue([]),
            listMdnsProfile: vi.fn().mockResolvedValue([]),
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

    it('listServiceType calls client with pagination', async () => {
        registerListServiceTypeTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listServiceType).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getServiceTypeSummary calls client', async () => {
        registerGetServiceTypeSummaryTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getServiceTypeSummary).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getGroupProfilesByType calls client with groupType', async () => {
        registerGetGroupProfilesByTypeTool(mockServer, mockClient);
        const result = await toolHandler({ groupType: '0' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('0', undefined, undefined);
    });

    it('getGroupProfilesByType passes siteId', async () => {
        registerGetGroupProfilesByTypeTool(mockServer, mockClient);
        await toolHandler({ groupType: '1', siteId: 'site-1' }, {});
        expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('1', 'site-1', undefined);
    });

    it('getLdapProfileList calls client', async () => {
        registerGetLdapProfileListTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getLdapProfileList).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getRadiusUserList calls client with pagination', async () => {
        registerGetRadiusUserListTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getRadiusUserList).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
    });

    it('getRadiusUserList passes sortUsername', async () => {
        registerGetRadiusUserListTool(mockServer, mockClient);
        await toolHandler({ page: 1, pageSize: 10, sortUsername: 'asc' }, {});
        expect(mockClient.getRadiusUserList).toHaveBeenCalledWith(1, 10, 'asc', undefined, undefined);
    });

    it('getPPSKProfiles calls client with type', async () => {
        registerGetPPSKProfilesTool(mockServer, mockClient);
        const result = await toolHandler({ type: 1 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getPPSKProfiles).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it('listMdnsProfile calls client', async () => {
        registerListMdnsProfileTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listMdnsProfile).toHaveBeenCalledWith(undefined, undefined);
    });
});
