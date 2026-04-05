import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSecurityOverviewTool } from '../../src/tools/getSecurityOverview.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSecurityOverview', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_name, _schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getThreatList: vi.fn(),
            getFirewallSetting: vi.fn(),
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

    it('should register the getSecurityOverview tool', () => {
        registerGetSecurityOverviewTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getSecurityOverview', expect.any(Object), expect.any(Function));
    });

    it('should call getThreatList and getFirewallSetting and return combined result', async () => {
        const mockThreats = { data: [{ id: 't1', severity: 0 }], totalRows: 1 };
        const mockFirewall = { enabled: true, defaultAction: 'drop' };

        vi.mocked(mockClient.getThreatList).mockResolvedValue(mockThreats as never);
        vi.mocked(mockClient.getFirewallSetting).mockResolvedValue(mockFirewall);

        registerGetSecurityOverviewTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(mockClient.getThreatList).toHaveBeenCalledWith(
            expect.objectContaining({ page: 1, pageSize: 20, archived: false, sortTime: 'desc' }),
            undefined
        );
        expect(mockClient.getFirewallSetting).toHaveBeenCalledWith(undefined, undefined);
        expect(parsed.activeThreats).toEqual(mockThreats);
        expect(parsed.firewallSettings).toEqual(mockFirewall);
    });

    it('should pass siteId to getFirewallSetting', async () => {
        vi.mocked(mockClient.getThreatList).mockResolvedValue({ data: [], totalRows: 0 } as never);
        vi.mocked(mockClient.getFirewallSetting).mockResolvedValue({});

        registerGetSecurityOverviewTool(mockServer, mockClient);
        await toolHandler({ siteId: 'site-2' }, { sessionId: 'test' });

        expect(mockClient.getFirewallSetting).toHaveBeenCalledWith('site-2', undefined);
    });

    it('should gracefully degrade when getThreatList fails', async () => {
        vi.mocked(mockClient.getThreatList).mockRejectedValue(new Error('threat endpoint unavailable'));
        vi.mocked(mockClient.getFirewallSetting).mockResolvedValue({ enabled: true });

        registerGetSecurityOverviewTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.activeThreats).toMatchObject({ _error: expect.stringContaining('threat endpoint unavailable') });
        expect(parsed.firewallSettings).toEqual({ enabled: true });
    });

    it('should gracefully degrade when getFirewallSetting fails', async () => {
        vi.mocked(mockClient.getThreatList).mockResolvedValue({ data: [], totalRows: 0 } as never);
        vi.mocked(mockClient.getFirewallSetting).mockRejectedValue(new Error('firewall unavailable'));

        registerGetSecurityOverviewTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.activeThreats).toEqual({ data: [], totalRows: 0 });
        expect(parsed.firewallSettings).toMatchObject({ _error: expect.stringContaining('firewall unavailable') });
    });

    it('should gracefully degrade when both calls fail', async () => {
        vi.mocked(mockClient.getThreatList).mockRejectedValue(new Error('err1'));
        vi.mocked(mockClient.getFirewallSetting).mockRejectedValue(new Error('err2'));

        registerGetSecurityOverviewTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.activeThreats).toMatchObject({ _error: expect.any(String) });
        expect(parsed.firewallSettings).toMatchObject({ _error: expect.any(String) });
    });
});
