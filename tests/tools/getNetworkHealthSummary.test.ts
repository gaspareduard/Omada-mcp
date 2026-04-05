import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetNetworkHealthSummaryTool } from '../../src/tools/getNetworkHealthSummary.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getNetworkHealthSummary', () => {
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
            getDashboardOverview: vi.fn(),
            getInternetInfo: vi.fn(),
            getClientsDistribution: vi.fn(),
            getThreatList: vi.fn(),
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

    it('should register the getNetworkHealthSummary tool', () => {
        registerGetNetworkHealthSummaryTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getNetworkHealthSummary', expect.any(Object), expect.any(Function));
    });

    it('should call all four client methods in parallel and return combined result', async () => {
        const mockOverview = { gateways: 1, switches: 2, aps: 5, clients: 30 };
        const mockInternet = { status: 'connected', ip: '1.2.3.4' };
        const mockDist = { wireless: 20, wired: 10 };
        const mockThreats = { data: [], totalRows: 0 };

        vi.mocked(mockClient.getDashboardOverview).mockResolvedValue(mockOverview);
        vi.mocked(mockClient.getInternetInfo).mockResolvedValue(mockInternet);
        vi.mocked(mockClient.getClientsDistribution).mockResolvedValue(mockDist);
        vi.mocked(mockClient.getThreatList).mockResolvedValue(mockThreats as never);

        registerGetNetworkHealthSummaryTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(mockClient.getDashboardOverview).toHaveBeenCalledWith(undefined, undefined);
        expect(mockClient.getInternetInfo).toHaveBeenCalledWith(undefined, undefined);
        expect(mockClient.getClientsDistribution).toHaveBeenCalledWith(undefined, undefined);
        expect(mockClient.getThreatList).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 5, archived: false }), undefined);

        expect(parsed.overview).toEqual(mockOverview);
        expect(parsed.internet).toEqual(mockInternet);
        expect(parsed.clientDistribution).toEqual(mockDist);
        expect(parsed.recentThreats).toEqual(mockThreats);
    });

    it('should pass siteId and customHeaders to all methods', async () => {
        vi.mocked(mockClient.getDashboardOverview).mockResolvedValue({});
        vi.mocked(mockClient.getInternetInfo).mockResolvedValue({});
        vi.mocked(mockClient.getClientsDistribution).mockResolvedValue({});
        vi.mocked(mockClient.getThreatList).mockResolvedValue({ data: [], totalRows: 0 } as never);

        registerGetNetworkHealthSummaryTool(mockServer, mockClient);
        await toolHandler({ siteId: 'site-1', customHeaders: { 'X-Custom': 'val' } }, { sessionId: 'test' });

        expect(mockClient.getDashboardOverview).toHaveBeenCalledWith('site-1', { 'X-Custom': 'val' });
        expect(mockClient.getInternetInfo).toHaveBeenCalledWith('site-1', { 'X-Custom': 'val' });
        expect(mockClient.getClientsDistribution).toHaveBeenCalledWith('site-1', { 'X-Custom': 'val' });
    });

    it('should gracefully degrade when one call fails', async () => {
        vi.mocked(mockClient.getDashboardOverview).mockResolvedValue({ gateways: 1 });
        vi.mocked(mockClient.getInternetInfo).mockRejectedValue(new Error('WAN unavailable'));
        vi.mocked(mockClient.getClientsDistribution).mockResolvedValue({ wireless: 5 });
        vi.mocked(mockClient.getThreatList).mockResolvedValue({ data: [], totalRows: 0 } as never);

        registerGetNetworkHealthSummaryTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.overview).toEqual({ gateways: 1 });
        expect(parsed.internet).toMatchObject({ _error: expect.stringContaining('WAN unavailable') });
        expect(parsed.clientDistribution).toEqual({ wireless: 5 });
    });

    it('should gracefully degrade when all calls fail', async () => {
        vi.mocked(mockClient.getDashboardOverview).mockRejectedValue(new Error('err'));
        vi.mocked(mockClient.getInternetInfo).mockRejectedValue(new Error('err'));
        vi.mocked(mockClient.getClientsDistribution).mockRejectedValue(new Error('err'));
        vi.mocked(mockClient.getThreatList).mockRejectedValue(new Error('err'));

        registerGetNetworkHealthSummaryTool(mockServer, mockClient);
        const result = (await toolHandler({}, { sessionId: 'test' })) as { content: { text: string }[] };
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.overview).toMatchObject({ _error: expect.any(String) });
        expect(parsed.internet).toMatchObject({ _error: expect.any(String) });
        expect(parsed.clientDistribution).toMatchObject({ _error: expect.any(String) });
        expect(parsed.recentThreats).toMatchObject({ _error: expect.any(String) });
    });
});
