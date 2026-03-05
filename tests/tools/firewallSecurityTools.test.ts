import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAclConfigTypeSettingTool } from '../../src/tools/getAclConfigTypeSetting.js';
import { registerGetAttackDefenseSettingTool } from '../../src/tools/getAttackDefenseSetting.js';
import { registerGetGridAllowListTool } from '../../src/tools/getGridAllowList.js';
import { registerGetGridBlockListTool } from '../../src/tools/getGridBlockList.js';
import { registerGetGridEapRuleTool } from '../../src/tools/getGridEapRule.js';
import { registerGetGridGatewayRuleTool } from '../../src/tools/getGridGatewayRule.js';
import { registerGetGridSignatureTool } from '../../src/tools/getGridSignature.js';
import { registerGetIpsConfigTool } from '../../src/tools/getIpsConfig.js';
import { registerGetOsgCustomAclListTool } from '../../src/tools/getOsgCustomAclList.js';
import { registerGetOswAclListTool } from '../../src/tools/getOswAclList.js';
import { registerGetUrlFilterGeneralTool } from '../../src/tools/getUrlFilterGeneral.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - firewall/ACL/security tools (issue #37)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler!: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;
        mockClient = {
            getAclConfigTypeSetting: vi.fn().mockResolvedValue({}),
            getOsgCustomAclList: vi.fn().mockResolvedValue({ data: [] }),
            getOswAclList: vi.fn().mockResolvedValue({ data: [] }),
            getIpsConfig: vi.fn().mockResolvedValue({}),
            getGridSignature: vi.fn().mockResolvedValue({ data: [] }),
            getGridAllowList: vi.fn().mockResolvedValue({ data: [] }),
            getGridBlockList: vi.fn().mockResolvedValue({ data: [] }),
            getAttackDefenseSetting: vi.fn().mockResolvedValue({}),
            getUrlFilterGeneral: vi.fn().mockResolvedValue({}),
            getGridGatewayRule: vi.fn().mockResolvedValue({ data: [] }),
            getGridEapRule: vi.fn().mockResolvedValue({ data: [] }),
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

    it('getAclConfigTypeSetting calls client', async () => {
        registerGetAclConfigTypeSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getAclConfigTypeSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getOsgCustomAclList calls client with pagination', async () => {
        registerGetOsgCustomAclListTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getOsgCustomAclList).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getOswAclList calls client with pagination', async () => {
        registerGetOswAclListTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getOswAclList).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getIpsConfig calls client', async () => {
        registerGetIpsConfigTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getIpsConfig).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getGridSignature calls client with pagination', async () => {
        registerGetGridSignatureTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridSignature).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getGridAllowList calls client with pagination and searchKey', async () => {
        registerGetGridAllowListTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10, searchKey: 'evil.com' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridAllowList).toHaveBeenCalledWith(1, 10, 'evil.com', undefined, undefined);
    });

    it('getGridAllowList passes undefined searchKey when omitted', async () => {
        registerGetGridAllowListTool(mockServer, mockClient);
        await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(mockClient.getGridAllowList).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
    });

    it('getGridBlockList calls client with pagination and searchKey', async () => {
        registerGetGridBlockListTool(mockServer, mockClient);
        const result = await toolHandler({ page: 2, pageSize: 20, searchKey: 'malware' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridBlockList).toHaveBeenCalledWith(2, 20, 'malware', undefined, undefined);
    });

    it('getAttackDefenseSetting calls client', async () => {
        registerGetAttackDefenseSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getAttackDefenseSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getUrlFilterGeneral calls client', async () => {
        registerGetUrlFilterGeneralTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getUrlFilterGeneral).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getGridGatewayRule calls client with pagination', async () => {
        registerGetGridGatewayRuleTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridGatewayRule).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getGridEapRule calls client with pagination', async () => {
        registerGetGridEapRuleTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridEapRule).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });
});
