import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetChannelsTool } from '../../src/tools/getChannels.js';
import { registerGetGridDashboardIpsecTunnelStatsTool } from '../../src/tools/getGridDashboardIpsecTunnelStats.js';
import { registerGetGridDashboardOpenVpnTunnelStatsTool } from '../../src/tools/getGridDashboardOpenVpnTunnelStats.js';
import { registerGetGridDashboardTunnelStatsTool } from '../../src/tools/getGridDashboardTunnelStats.js';
import { registerGetInterferenceTool } from '../../src/tools/getInterference.js';
import { registerGetIspLoadTool } from '../../src/tools/getIspLoad.js';
import { registerGetRetryAndDroppedRateTool } from '../../src/tools/getRetryAndDroppedRate.js';
import { registerGetTrafficDistributionTool } from '../../src/tools/getTrafficDistribution.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - dashboard & monitor tools (issue #34)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn(captureHandler),
        } as unknown as McpServer;

        mockClient = {
            getTrafficDistribution: vi.fn().mockResolvedValue({ data: [] }),
            getRetryAndDroppedRate: vi.fn().mockResolvedValue({ data: [] }),
            getIspLoad: vi.fn().mockResolvedValue({ data: [] }),
            getChannels: vi.fn().mockResolvedValue({ data: [] }),
            getInterference: vi.fn().mockResolvedValue([]),
            getGridDashboardTunnelStats: vi.fn().mockResolvedValue({ data: [] }),
            getGridDashboardIpsecTunnelStats: vi.fn().mockResolvedValue({ data: [] }),
            getGridDashboardOpenVpnTunnelStats: vi.fn().mockResolvedValue({ data: [] }),
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

    describe('getTrafficDistribution', () => {
        it('should call client with start and end params', async () => {
            registerGetTrafficDistributionTool(mockServer, mockClient);
            const result = await toolHandler({ start: 1000000, end: 2000000 }, {});
            expect(result).toBeDefined();
            expect(mockClient.getTrafficDistribution).toHaveBeenCalledWith(undefined, 1000000, 2000000, undefined);
        });

        it('should pass siteId when provided', async () => {
            registerGetTrafficDistributionTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1', start: 1000000, end: 2000000 }, {});
            expect(mockClient.getTrafficDistribution).toHaveBeenCalledWith('site-1', 1000000, 2000000, undefined);
        });
    });

    describe('getRetryAndDroppedRate', () => {
        it('should call client with start and end params', async () => {
            registerGetRetryAndDroppedRateTool(mockServer, mockClient);
            const result = await toolHandler({ start: 1000000, end: 2000000 }, {});
            expect(result).toBeDefined();
            expect(mockClient.getRetryAndDroppedRate).toHaveBeenCalledWith(undefined, 1000000, 2000000, undefined);
        });
    });

    describe('getIspLoad', () => {
        it('should call client with start and end params', async () => {
            registerGetIspLoadTool(mockServer, mockClient);
            const result = await toolHandler({ start: 1000000, end: 2000000 }, {});
            expect(result).toBeDefined();
            expect(mockClient.getIspLoad).toHaveBeenCalledWith(undefined, 1000000, 2000000, undefined);
        });
    });

    describe('getChannels', () => {
        it('should execute successfully', async () => {
            registerGetChannelsTool(mockServer, mockClient);
            const result = await toolHandler({}, {});
            expect(result).toBeDefined();
            expect(mockClient.getChannels).toHaveBeenCalledWith(undefined, undefined);
        });
    });

    describe('getInterference', () => {
        it('should execute successfully', async () => {
            registerGetInterferenceTool(mockServer, mockClient);
            const result = await toolHandler({}, {});
            expect(result).toBeDefined();
            expect(mockClient.getInterference).toHaveBeenCalledWith(undefined, undefined);
        });
    });

    describe('getGridDashboardTunnelStats', () => {
        it('should call client with type param', async () => {
            registerGetGridDashboardTunnelStatsTool(mockServer, mockClient);
            const result = await toolHandler({ type: 0 }, {});
            expect(result).toBeDefined();
            expect(mockClient.getGridDashboardTunnelStats).toHaveBeenCalledWith(undefined, 0, undefined);
        });
    });

    describe('getGridDashboardIpsecTunnelStats', () => {
        it('should execute successfully', async () => {
            registerGetGridDashboardIpsecTunnelStatsTool(mockServer, mockClient);
            const result = await toolHandler({}, {});
            expect(result).toBeDefined();
            expect(mockClient.getGridDashboardIpsecTunnelStats).toHaveBeenCalledWith(undefined, undefined);
        });
    });

    describe('getGridDashboardOpenVpnTunnelStats', () => {
        it('should call client with type param', async () => {
            registerGetGridDashboardOpenVpnTunnelStatsTool(mockServer, mockClient);
            const result = await toolHandler({ type: 0 }, {});
            expect(result).toBeDefined();
            expect(mockClient.getGridDashboardOpenVpnTunnelStats).toHaveBeenCalledWith(undefined, 0, undefined);
        });
    });
});
