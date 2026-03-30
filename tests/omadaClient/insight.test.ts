import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InsightOperations } from '../../src/omadaClient/insight.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse, PaginatedResult } from '../../src/types/index.js';

describe('InsightOperations', () => {
    let insightOps: InsightOperations;
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
            resolveSiteId: vi.fn((siteId?: string) => siteId ?? 'default-site'),
        } as unknown as SiteOperations;

        mockBuildPath = vi.fn((path: string) => `/openapi/v1/test-omadac${path}`);

        insightOps = new InsightOperations(mockRequest, mockSite, mockBuildPath);
    });

    describe('listSiteThreatManagement', () => {
        it('should list site threat management events', async () => {
            const mockResult: PaginatedResult<unknown> = {
                data: [{ id: 'threat-1', severity: 'high' }],
                totalRows: 1,
                currentPage: 1,
                currentSize: 1,
            };
            const mockResponse: OmadaApiResponse<PaginatedResult<unknown>> = { errorCode: 0, result: mockResult };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await insightOps.listSiteThreatManagement({ page: 1, pageSize: 10 }, 'site-123');

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/ips/grid/threat-management',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual(mockResult);
        });

        it('should include optional filters when provided', async () => {
            const mockResponse: OmadaApiResponse<PaginatedResult<unknown>> = {
                errorCode: 0,
                result: { data: [], totalRows: 0, currentPage: 1, currentSize: 0 },
            };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            await insightOps.listSiteThreatManagement(
                { page: 1, pageSize: 10, startTime: 1000000, endTime: 2000000, searchKey: 'attack' },
                'site-123'
            );

            expect(mockRequest.get).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    'filters.startTime': 1000000,
                    'filters.endTime': 2000000,
                    searchKey: 'attack',
                }),
                undefined
            );
        });
    });

    describe('getWids', () => {
        it('should fetch WIDS information', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { attacks: 0 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await insightOps.getWids('site-123');

            expect(result).toEqual({ attacks: 0 });
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/insight/wids', undefined, undefined);
        });
    });

    describe('getWidsBlacklist', () => {
        it('should fetch WIDS blacklist', async () => {
            const mockItems = [{ mac: '00:11:22:33:44:55' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockItems);

            const result = await insightOps.getWidsBlacklist('site-123');

            expect(result).toEqual(mockItems);
            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/insight/wids/blacklist', {}, undefined);
        });
    });

    describe('getRogueAps', () => {
        it('should fetch rogue APs', async () => {
            const mockAps = [{ ssid: 'Evil-AP', mac: 'ff:ee:dd:cc:bb:aa' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockAps);

            const result = await insightOps.getRogueAps('site-123');

            expect(result).toEqual(mockAps);
        });
    });

    describe('getVpnTunnelStats', () => {
        it('should fetch VPN tunnel stats', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { activeTunnels: 2 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await insightOps.getVpnTunnelStats(1, 10, 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/vpn/stats/tunnel',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual({ activeTunnels: 2 });
        });
    });

    describe('getIpsecVpnStats', () => {
        it('should fetch IPsec VPN stats', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { tunnels: 1 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await insightOps.getIpsecVpnStats(1, 10, 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/vpn/stats/ipsec',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual({ tunnels: 1 });
        });
    });

    describe('listInsightClients', () => {
        it('should list insight clients with pagination', async () => {
            const mockResult: PaginatedResult<unknown> = {
                data: [{ mac: '00:11:22:33:44:55' }],
                totalRows: 1,
                currentPage: 1,
                currentSize: 1,
            };
            const mockResponse: OmadaApiResponse<PaginatedResult<unknown>> = { errorCode: 0, result: mockResult };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await insightOps.listInsightClients(1, 10, 'site-123');

            expect(result).toEqual(mockResult);
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/insight/clients',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getRoutingTable', () => {
        it('should fetch routing table', async () => {
            const mockRoutes = [{ destination: '10.0.0.0/8', gateway: '192.168.1.1' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockRoutes);

            const result = await insightOps.getRoutingTable('static', 'site-123');

            expect(result).toEqual(mockRoutes);
            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/insight/routing/static', {}, undefined);
        });
    });

    describe('getThreatDetail', () => {
        it('should get threat detail with explicit time', async () => {
            const mockResponse = { errorCode: 0, result: { id: 'threat-1' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse.result);

            await insightOps.getThreatDetail('threat-1', 1640000000, 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/ips/threat/threat-1',
                { time: 1640000000 },
                undefined
            );
        });

        it('should use current time when time is not provided', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse.result);
            const before = Math.floor(Date.now() / 1000);

            await insightOps.getThreatDetail('threat-2', undefined, 'site-123');

            const callArgs = (mockRequest.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as { time: number };
            expect(callArgs.time).toBeGreaterThanOrEqual(before);
            expect(callArgs.time).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 1);
        });
    });
});
