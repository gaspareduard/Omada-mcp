import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NetworkOperations } from '../../src/omadaClient/network.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse, PaginatedResult } from '../../src/types/index.js';

describe('NetworkOperations', () => {
    let networkOps: NetworkOperations;
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

        networkOps = new NetworkOperations(mockRequest, mockSite, mockBuildPath);
    });

    describe('getInternetInfo', () => {
        it('should fetch internet info for a site', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { wanType: 'static', ip: '192.168.1.1' },
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getInternetInfo('site-123');

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/internet');
            expect(result).toEqual({ wanType: 'static', ip: '192.168.1.1' });
        });

        it('should use default site when siteId is not provided', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: {},
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            await networkOps.getInternetInfo();

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
        });
    });

    describe('getPortForwardingStatus', () => {
        it('should fetch port forwarding status for User type', async () => {
            const mockResult: PaginatedResult<unknown> = {
                data: [{ name: 'Rule1', externalPort: 80 }],
                totalRows: 1,
                currentPage: 1,
                currentSize: 1,
            };
            const mockResponse: OmadaApiResponse<PaginatedResult<unknown>> = {
                errorCode: 0,
                result: mockResult,
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getPortForwardingStatus('User', 'site-123', 1, 10);

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/insight/port-forwarding/User', {
                page: 1,
                pageSize: 10,
            });
            expect(result).toEqual(mockResult);
        });

        it('should fetch port forwarding status for UPnP type', async () => {
            const mockResult: PaginatedResult<unknown> = {
                data: [{ name: 'UPnP Rule', externalPort: 8080 }],
                totalRows: 1,
                currentPage: 1,
                currentSize: 1,
            };
            const mockResponse: OmadaApiResponse<PaginatedResult<unknown>> = {
                errorCode: 0,
                result: mockResult,
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getPortForwardingStatus('UPnP', 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/insight/port-forwarding/UPnP', {
                page: 1,
                pageSize: 10,
            });
            expect(result).toEqual(mockResult);
        });
    });

    describe('getLanNetworkList', () => {
        it('should fetch LAN network list using v2 API', async () => {
            const mockData = [
                { id: 'net1', name: 'LAN1', vlan: 10 },
                { id: 'net2', name: 'LAN2', vlan: 20 },
            ];

            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.getLanNetworkList('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v2/test-omadac/sites/site-123/lan-networks');
            expect(result).toEqual(mockData);
        });
    });

    describe('getLanProfileList', () => {
        it('should fetch LAN profile list', async () => {
            const mockData = [
                { id: 'prof1', name: 'Profile1' },
                { id: 'prof2', name: 'Profile2' },
            ];

            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.getLanProfileList('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/lan-profiles');
            expect(result).toEqual(mockData);
        });
    });

    describe('getWlanGroupList', () => {
        it('should fetch WLAN group list', async () => {
            const mockData = [
                { id: 'wlan1', name: 'WLAN Group 1' },
                { id: 'wlan2', name: 'WLAN Group 2' },
            ];
            const mockResponse: OmadaApiResponse<unknown[]> = {
                errorCode: 0,
                result: mockData,
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getWlanGroupList('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/wireless-network/wlans');
            expect(result).toEqual(mockData);
        });
    });

    describe('getSsidList', () => {
        it('should fetch SSID list for a WLAN group', async () => {
            const mockData = [
                { id: 'ssid1', name: 'WiFi-1' },
                { id: 'ssid2', name: 'WiFi-2' },
            ];

            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.getSsidList('wlan-123', 'site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/wireless-network/wlans/wlan-123/ssids');
            expect(result).toEqual(mockData);
        });

        it('should throw error when wlanId is not provided', async () => {
            await expect(networkOps.getSsidList('', 'site-123')).rejects.toThrow(
                'A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.'
            );
        });
    });

    describe('getSsidDetail', () => {
        it('should fetch detailed SSID information', async () => {
            const mockData = {
                id: 'ssid1',
                name: 'WiFi-1',
                security: 'WPA2',
                encryption: 'AES',
            };
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: mockData,
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getSsidDetail('wlan-123', 'ssid-456', 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/wireless-network/wlans/wlan-123/ssids/ssid-456');
            expect(result).toEqual(mockData);
        });

        it('should throw error when wlanId is not provided', async () => {
            await expect(networkOps.getSsidDetail('', 'ssid-456', 'site-123')).rejects.toThrow(
                'A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.'
            );
        });

        it('should throw error when ssidId is not provided', async () => {
            await expect(networkOps.getSsidDetail('wlan-123', '', 'site-123')).rejects.toThrow(
                'An ssidId must be provided. Use getSsidList to get available SSID IDs.'
            );
        });
    });

    describe('getFirewallSetting', () => {
        it('should fetch firewall settings for a site', async () => {
            const mockData = {
                aclEnabled: true,
                rules: [{ name: 'Rule1', action: 'allow' }],
            };
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: mockData,
            };

            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getFirewallSetting('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/firewall');
            expect(result).toEqual(mockData);
        });
    });
});
