import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetIpsecVpnStatsTool } from '../../src/tools/getIpsecVpnStats.js';
import { registerGetRoutingTableTool } from '../../src/tools/getRoutingTable.js';
import { registerGetThreatCountTool } from '../../src/tools/getThreatCount.js';
import { registerGetThreatDetailTool } from '../../src/tools/getThreatDetail.js';
import { registerGetWidsBlacklistTool } from '../../src/tools/getWidsBlacklist.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - insight & routing tools (issue #43)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getIpsecVpnStats: vi.fn(),
            getWidsBlacklist: vi.fn(),
            getRoutingTable: vi.fn(),
            getThreatSeverity: vi.fn(),
            getThreatDetail: vi.fn(),
        } as unknown as OmadaClient;

        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            // Mock implementation
        });
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getIpsecVpnStats', () => {
        it('should register and execute successfully', async () => {
            const mockStats = { tunnels: [{ name: 'tunnel1', status: 'connected' }] };
            (mockClient.getIpsecVpnStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);

            registerGetIpsecVpnStatsTool(mockServer, mockClient);
            const result = await toolHandler({ page: 1, pageSize: 10 }, {});

            expect(mockServer.registerTool).toHaveBeenCalledWith('getIpsecVpnStats', expect.any(Object), expect.any(Function));
            expect(result).toBeDefined();
            expect(mockClient.getIpsecVpnStats).toHaveBeenCalledWith(1, 10, undefined, undefined);
        });

        it('should pass siteId and customHeaders to client', async () => {
            (mockClient.getIpsecVpnStats as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetIpsecVpnStatsTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 20, siteId: 'site123', customHeaders: { 'X-Token': 'abc' } }, {});

            expect(mockClient.getIpsecVpnStats).toHaveBeenCalledWith(1, 20, 'site123', { 'X-Token': 'abc' });
        });
    });

    describe('getWidsBlacklist', () => {
        it('should register and execute successfully', async () => {
            const mockBlacklist = [{ mac: 'AA:BB:CC:DD:EE:FF', reason: 'Rogue AP' }];
            (mockClient.getWidsBlacklist as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlacklist);

            registerGetWidsBlacklistTool(mockServer, mockClient);
            const result = await toolHandler({}, {});

            expect(mockServer.registerTool).toHaveBeenCalledWith('getWidsBlacklist', expect.any(Object), expect.any(Function));
            expect(result).toBeDefined();
            expect(mockClient.getWidsBlacklist).toHaveBeenCalledOnce();
        });

        it('should pass siteId and customHeaders to client', async () => {
            (mockClient.getWidsBlacklist as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            registerGetWidsBlacklistTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site456' }, {});

            expect(mockClient.getWidsBlacklist).toHaveBeenCalledWith('site456', undefined);
        });
    });

    describe('getRoutingTable', () => {
        it('should register and execute successfully with static type', async () => {
            const mockRoutes = [{ destination: '0.0.0.0/0', gateway: '192.168.1.1' }];
            (mockClient.getRoutingTable as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoutes);

            registerGetRoutingTableTool(mockServer, mockClient);
            const result = await toolHandler({ type: 'static' }, {});

            expect(mockServer.registerTool).toHaveBeenCalledWith('getRoutingTable', expect.any(Object), expect.any(Function));
            expect(result).toBeDefined();
            expect(mockClient.getRoutingTable).toHaveBeenCalledWith('static', undefined, undefined);
        });

        it('should pass policy type correctly', async () => {
            (mockClient.getRoutingTable as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            registerGetRoutingTableTool(mockServer, mockClient);
            await toolHandler({ type: 'policy', siteId: 'siteABC' }, {});

            expect(mockClient.getRoutingTable).toHaveBeenCalledWith('policy', 'siteABC', undefined);
        });

        it('should pass ospf type correctly', async () => {
            (mockClient.getRoutingTable as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            registerGetRoutingTableTool(mockServer, mockClient);
            await toolHandler({ type: 'ospf' }, {});

            expect(mockClient.getRoutingTable).toHaveBeenCalledWith('ospf', undefined, undefined);
        });
    });

    describe('getThreatCount', () => {
        it('should register and execute successfully', async () => {
            const mockCount = { critical: 2, high: 5, medium: 10, low: 3 };
            (mockClient.getThreatSeverity as ReturnType<typeof vi.fn>).mockResolvedValue(mockCount);

            registerGetThreatCountTool(mockServer, mockClient);
            const result = await toolHandler({ startTime: 1700000000, endTime: 1700086400 }, {});

            expect(mockServer.registerTool).toHaveBeenCalledWith('getThreatCount', expect.any(Object), expect.any(Function));
            expect(result).toBeDefined();
            expect(mockClient.getThreatSeverity).toHaveBeenCalledWith(1700000000, 1700086400, undefined);
        });
    });

    describe('getThreatDetail', () => {
        it('should register and execute successfully', async () => {
            const mockDetail = { id: 'threat-001', type: 'SQL Injection', severity: 'high' };
            (mockClient.getThreatDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockDetail);

            registerGetThreatDetailTool(mockServer, mockClient);
            const result = await toolHandler({ threatId: 'threat-001', time: 1700000000 }, {});

            expect(mockServer.registerTool).toHaveBeenCalledWith('getThreatDetail', expect.any(Object), expect.any(Function));
            expect(result).toBeDefined();
            expect(mockClient.getThreatDetail).toHaveBeenCalledWith('threat-001', 1700000000, undefined, undefined);
        });

        it('should pass time and siteId to client', async () => {
            (mockClient.getThreatDetail as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetThreatDetailTool(mockServer, mockClient);
            await toolHandler({ threatId: 'threat-002', time: 1700000000, siteId: 'siteXYZ' }, {});

            expect(mockClient.getThreatDetail).toHaveBeenCalledWith('threat-002', 1700000000, 'siteXYZ', undefined);
        });
    });
});
