import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NetworkOperations } from '../../src/omadaClient/network.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse, PaginatedResult } from '../../src/types/index.js';

describe('NetworkOperations', () => {
    let networkOps: NetworkOperations;
    let mockRequest: RequestHandler;
    let mockSite: SiteOperations;
    let mockBuildPath: (path: string, version?: string) => string;

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

        mockBuildPath = vi.fn((path: string, version = 'v1') => `/openapi/${version}/test-omadac${path}`);

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
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/internet', undefined, undefined);
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

            const result = await networkOps.getPortForwardingStatus('user', 'site-123', 1, 10);

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/insight/port-forwarding/user',
                {
                    page: 1,
                    pageSize: 10,
                },
                undefined
            );
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

            const result = await networkOps.getPortForwardingStatus('upnp', 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/insight/port-forwarding/upnp',
                {
                    page: 1,
                    pageSize: 10,
                },
                undefined
            );
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

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v2/test-omadac/sites/site-123/lan-networks', {}, undefined);
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

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/lan-profiles', {}, undefined);
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

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/wireless-network/wlans', undefined, undefined);
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

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/wireless-network/wlans/wlan-123/ssids',
                {},
                undefined
            );
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

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/wireless-network/wlans/wlan-123/ssids/ssid-456',
                undefined,
                undefined
            );
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

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/firewall', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getVpnSettings', () => {
        it('should fetch VPN settings for a site', async () => {
            const mockData = { enabled: true, type: 'ipsec' };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getVpnSettings('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/vpn', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listSiteToSiteVpns', () => {
        it('should list site-to-site VPN configurations', async () => {
            const mockData = [{ id: 'vpn-1', name: 'Main VPN' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listSiteToSiteVpns('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/vpn/site-to-site-vpns', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listClientToSiteVpnServers', () => {
        it('should list client-to-site VPN server configurations', async () => {
            const mockData = [{ id: 'server-1', name: 'VPN Server' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listClientToSiteVpnServers('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/client-to-site-vpn-servers',
                {},
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('listPortForwardingRules', () => {
        it('should list NAT port forwarding rules', async () => {
            const mockData = [{ id: 'rule-1', externalPort: 80 }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listPortForwardingRules('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/nat/port-forwardings', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listOneToOneNatRules', () => {
        it('should list one-to-one NAT rules', async () => {
            const mockData = [{ id: 'nat-1', externalIp: '1.2.3.4' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listOneToOneNatRules('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/nat/one-to-one-nat', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listOsgAcls', () => {
        it('should list OSG ACL rules', async () => {
            const mockData = [{ id: 'acl-1', action: 'allow' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listOsgAcls('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osg-acls', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listEapAcls', () => {
        it('should list EAP ACL rules', async () => {
            const mockData = [{ id: 'eap-acl-1', action: 'deny' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listEapAcls('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/eap-acls', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listOswAcls', () => {
        it('should list OSW ACL rules', async () => {
            const mockData = [{ id: 'osw-acl-1', action: 'allow' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listOswAcls('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osw-acls', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listStaticRoutes', () => {
        it('should list static routing rules', async () => {
            const mockData = [{ id: 'route-1', destination: '10.0.0.0/24' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listStaticRoutes('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/routing/static-routings', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listPolicyRoutes', () => {
        it('should list policy routing rules', async () => {
            const mockData = [{ id: 'policy-1', name: 'Policy Route 1' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listPolicyRoutes('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/routing/policy-routings', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listRadiusProfiles', () => {
        it('should list RADIUS profiles', async () => {
            const mockData = [{ id: 'radius-1', name: 'Corp RADIUS' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listRadiusProfiles('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/profiles/radius', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listGroupProfiles', () => {
        it('should list group profiles without type', async () => {
            const mockData = [{ id: 'group-1', name: 'Group 1' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listGroupProfiles(undefined, 'site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/profiles/groups', {}, undefined);
            expect(result).toEqual(mockData);
        });

        it('should list group profiles with specific type', async () => {
            const mockData = [{ id: 'ip-group-1', name: 'IP Group 1' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listGroupProfiles('ip', 'site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/profiles/groups/ip', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getApplicationControlStatus', () => {
        it('should get application control status', async () => {
            const mockData = { enabled: true };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getApplicationControlStatus('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/applicationControl/status', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getBandwidthControl', () => {
        it('should get bandwidth control settings', async () => {
            const mockData = { enabled: true, uplimit: 100 };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getBandwidthControl('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/bandwidth-control', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getSshSetting', () => {
        it('should get SSH settings', async () => {
            const mockData = { enabled: false };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getSshSetting('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/ssh', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getLedSetting', () => {
        it('should get LED settings', async () => {
            const mockData = { enabled: true };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getLedSetting('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/led', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listTimeRangeProfiles', () => {
        it('should list time range profiles', async () => {
            const mockData = [{ id: 'tr-1', name: 'Business Hours' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listTimeRangeProfiles('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/time-range-profiles', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listPortSchedules', () => {
        it('should list port schedules', async () => {
            const mockData = [{ id: 'ps-1', name: 'Schedule 1' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listPortSchedules('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/port-schedules', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listPoeSchedules', () => {
        it('should list PoE schedules', async () => {
            const mockData = [{ id: 'poe-1', name: 'PoE Schedule 1' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listPoeSchedules('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/poe-schedules', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getGatewayUrlFilters', () => {
        it('should get gateway URL filter settings', async () => {
            const mockData = { enabled: true, rules: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getGatewayUrlFilters('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/url-filters/gateway', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getEapUrlFilters', () => {
        it('should get EAP URL filter settings', async () => {
            const mockData = { enabled: false, rules: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getEapUrlFilters('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/url-filters/eap', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listAllSsids', () => {
        it('should list all SSIDs across WLAN groups', async () => {
            const mockData = [{ id: 'ssid-1', name: 'Corp-WiFi' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listAllSsids('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/wireless-network/ssids', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getWanLanStatus', () => {
        it('should get WAN-LAN connectivity status', async () => {
            const mockData = { wan: 'connected', lan: 'active' };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getWanLanStatus('site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/wan-lan-status', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('listBandwidthControlRules', () => {
        it('should list bandwidth control rules', async () => {
            const mockData = [{ id: 'bw-1', name: 'Limit 10Mbps' }];
            vi.mocked(mockRequest.fetchPaginated).mockResolvedValue(mockData);

            const result = await networkOps.listBandwidthControlRules('site-123');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/bandwidth-control/rules', {}, undefined);
            expect(result).toEqual(mockData);
        });
    });
});
