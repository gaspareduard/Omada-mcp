import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MonitorOperations } from '../../src/omadaClient/monitor.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse } from '../../src/types/index.js';

describe('MonitorOperations', () => {
    let monitorOps: MonitorOperations;
    let mockRequest: RequestHandler;
    let mockSite: SiteOperations;
    let mockBuildPath: (path: string) => string;

    beforeEach(() => {
        mockRequest = {
            get: vi.fn(),
            fetchPaginated: vi.fn(),
            ensureSuccess: vi.fn((response: OmadaApiResponse<unknown>) => {
                if (response.errorCode === 0) {
                    return response.result;
                }
                throw new Error(response.msg ?? 'API Error');
            }),
        } as unknown as RequestHandler;

        mockSite = {
            resolveSiteId: vi.fn(async (siteId?: string) => siteId ?? 'default-site'),
        } as unknown as SiteOperations;

        mockBuildPath = vi.fn((path: string) => `/openapi/v1/test-omadac${path}`);

        monitorOps = new MonitorOperations(mockRequest, mockSite, mockBuildPath);
    });

    describe('getDashboardWifiSummary', () => {
        it('should fetch WiFi summary for a site', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { totalAps: 5, connectedAps: 4 },
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardWifiSummary('site-123');

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/dashboard/wifi-summary', undefined, undefined);
            expect(result).toEqual({ totalAps: 5, connectedAps: 4 });
        });

        it('should use default site when siteId is not provided', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            await monitorOps.getDashboardWifiSummary();

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
        });
    });

    describe('getDashboardSwitchSummary', () => {
        it('should fetch switch summary for a site', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { totalSwitches: 3 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardSwitchSummary('site-123');

            expect(result).toEqual({ totalSwitches: 3 });
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/dashboard/switch-summary', undefined, undefined);
        });
    });

    describe('getTrafficDistribution', () => {
        it('should fetch traffic distribution', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { categories: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getTrafficDistribution('site-123', 1000000, 2000000);

            expect(result).toEqual({ categories: [] });
        });
    });

    describe('getDashboardTrafficActivities', () => {
        it('should fetch traffic activities', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardTrafficActivities('site-123');

            expect(result).toEqual({ data: [] });
        });
    });

    describe('getDashboardPoEUsage', () => {
        it('should fetch PoE usage', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { totalPower: 100 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardPoEUsage('site-123');

            expect(result).toEqual({ totalPower: 100 });
        });
    });

    describe('getDashboardTopCpuUsage', () => {
        it('should fetch top CPU usage devices', async () => {
            const mockResponse: OmadaApiResponse<unknown[]> = {
                errorCode: 0,
                result: [{ mac: '00:11:22:33:44:55', cpu: 85 }],
            };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardTopCpuUsage('site-123');

            expect(result).toEqual([{ mac: '00:11:22:33:44:55', cpu: 85 }]);
        });

        it('should return empty array when result is null', async () => {
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: null as unknown as unknown[] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardTopCpuUsage('site-123');

            expect(result).toEqual([]);
        });
    });

    describe('getDashboardTopMemoryUsage', () => {
        it('should fetch top memory usage devices', async () => {
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: [{ mac: '00:11:22:33:44:55', mem: 90 }] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardTopMemoryUsage('site-123');

            expect(result).toEqual([{ mac: '00:11:22:33:44:55', mem: 90 }]);
        });
    });

    describe('getDashboardMostActiveSwitches', () => {
        it('should fetch most active switches', async () => {
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: [{ mac: 'aa:bb:cc:dd:ee:ff', traffic: 1000 }] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardMostActiveSwitches('site-123');

            expect(result).toEqual([{ mac: 'aa:bb:cc:dd:ee:ff', traffic: 1000 }]);
        });
    });

    describe('getDashboardMostActiveEaps', () => {
        it('should fetch most active EAPs', async () => {
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: [{ mac: 'aa:bb:cc:11:22:33', traffic: 500 }] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardMostActiveEaps('site-123');

            expect(result).toEqual([{ mac: 'aa:bb:cc:11:22:33', traffic: 500 }]);
        });
    });

    describe('getDashboardOverview', () => {
        it('should fetch dashboard overview', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { devices: 10, clients: 50 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getDashboardOverview('site-123');

            expect(result).toEqual({ devices: 10, clients: 50 });
        });
    });

    describe('getChannels', () => {
        it('should fetch channel information', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { channels: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getChannels('site-123');

            expect(result).toEqual({ channels: [] });
        });
    });

    describe('getIspLoad', () => {
        it('should fetch ISP load information', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { load: 0.5 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getIspLoad('site-123', 1000000, 2000000);

            expect(result).toEqual({ load: 0.5 });
        });
    });

    describe('getRetryAndDroppedRate', () => {
        it('should fetch retry and dropped rate', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { retryRate: 0.1, dropRate: 0.02 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getRetryAndDroppedRate('site-123', 1000000, 2000000);

            expect(result).toEqual({ retryRate: 0.1, dropRate: 0.02 });
        });
    });

    describe('getInterference', () => {
        it('should fetch interference data', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getInterference('site-123');

            expect(result).toEqual([]);
        });
    });

    describe('getGridDashboardTunnelStats', () => {
        it('should fetch tunnel stats by type', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { total: 2 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getGridDashboardTunnelStats('site-123', 0);

            expect(result).toEqual({ total: 2 });
        });
    });

    describe('getGridDashboardIpsecTunnelStats', () => {
        it('should fetch IPsec tunnel stats', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { connected: 1 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getGridDashboardIpsecTunnelStats('site-123');

            expect(result).toEqual({ connected: 1 });
        });
    });

    describe('getGridDashboardOpenVpnTunnelStats', () => {
        it('should fetch OpenVPN tunnel stats by type', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { connected: 3 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await monitorOps.getGridDashboardOpenVpnTunnelStats('site-123', 0);

            expect(result).toEqual({ connected: 3 });
        });
    });
});
