import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientToSiteVpnServerInfoTool } from '../../src/tools/getClientToSiteVpnServerInfo.js';
import { registerGetGridIpsecFailoverTool } from '../../src/tools/getGridIpsecFailover.js';
import { registerGetSiteToSiteVpnInfoTool } from '../../src/tools/getSiteToSiteVpnInfo.js';
import { registerGetSslVpnServerSettingTool } from '../../src/tools/getSslVpnServerSetting.js';
import { registerGetWireguardSummaryTool } from '../../src/tools/getWireguardSummary.js';
import { registerListClientToSiteVpnClientsTool } from '../../src/tools/listClientToSiteVpnClients.js';
import { registerListClientToSiteVpnServersTool } from '../../src/tools/listClientToSiteVpnServers.js';
import { registerListWireguardTool } from '../../src/tools/listWireguard.js';
import { registerListWireguardPeersTool } from '../../src/tools/listWireguardPeers.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - VPN tools (issue #39)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;
        mockClient = {
            getSiteToSiteVpnInfo: vi.fn().mockResolvedValue({}),
            listWireguard: vi.fn().mockResolvedValue({ data: [] }),
            listWireguardPeers: vi.fn().mockResolvedValue({ data: [] }),
            getWireguardSummary: vi.fn().mockResolvedValue({}),
            listClientToSiteVpnServers: vi.fn().mockResolvedValue([]),
            listClientToSiteVpnClients: vi.fn().mockResolvedValue({}),
            getClientToSiteVpnServerInfo: vi.fn().mockResolvedValue({}),
            getSslVpnServerSetting: vi.fn().mockResolvedValue({}),
            getGridIpsecFailover: vi.fn().mockResolvedValue({ data: [] }),
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

    it('getSiteToSiteVpnInfo calls client with vpnId', async () => {
        registerGetSiteToSiteVpnInfoTool(mockServer, mockClient);
        const result = await toolHandler({ vpnId: 'vpn-001' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getSiteToSiteVpnInfo).toHaveBeenCalledWith('vpn-001', undefined, undefined);
    });

    it('getSiteToSiteVpnInfo passes siteId', async () => {
        registerGetSiteToSiteVpnInfoTool(mockServer, mockClient);
        await toolHandler({ vpnId: 'vpn-001', siteId: 'site-1' }, {});
        expect(mockClient.getSiteToSiteVpnInfo).toHaveBeenCalledWith('vpn-001', 'site-1', undefined);
    });

    it('listWireguard calls client with pagination', async () => {
        registerListWireguardTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listWireguard).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
    });

    it('listWireguard passes searchKey', async () => {
        registerListWireguardTool(mockServer, mockClient);
        await toolHandler({ page: 1, pageSize: 10, searchKey: 'wg0' }, {});
        expect(mockClient.listWireguard).toHaveBeenCalledWith(1, 10, 'wg0', undefined, undefined);
    });

    it('listWireguardPeers calls client with pagination', async () => {
        registerListWireguardPeersTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.listWireguardPeers).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('getWireguardSummary calls client', async () => {
        registerGetWireguardSummaryTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getWireguardSummary).toHaveBeenCalledWith(undefined, undefined);
    });

    it('listClientToSiteVpnServers calls client', async () => {
        registerListClientToSiteVpnServersTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listClientToSiteVpnServers).toHaveBeenCalledWith(undefined, undefined);
    });

    it('listClientToSiteVpnClients calls client', async () => {
        registerListClientToSiteVpnClientsTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.listClientToSiteVpnClients).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getClientToSiteVpnServerInfo calls client with vpnId', async () => {
        registerGetClientToSiteVpnServerInfoTool(mockServer, mockClient);
        const result = await toolHandler({ vpnId: 'server-001' }, {});
        expect(result).toBeDefined();
        expect(mockClient.getClientToSiteVpnServerInfo).toHaveBeenCalledWith('server-001', undefined, undefined);
    });

    it('getSslVpnServerSetting calls client', async () => {
        registerGetSslVpnServerSettingTool(mockServer, mockClient);
        const result = await toolHandler({}, {});
        expect(result).toBeDefined();
        expect(mockClient.getSslVpnServerSetting).toHaveBeenCalledWith(undefined, undefined);
    });

    it('getGridIpsecFailover calls client with pagination', async () => {
        registerGetGridIpsecFailoverTool(mockServer, mockClient);
        const result = await toolHandler({ page: 1, pageSize: 10 }, {});
        expect(result).toBeDefined();
        expect(mockClient.getGridIpsecFailover).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });
});
