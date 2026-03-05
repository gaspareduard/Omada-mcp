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

    // -------------------------------------------------------------------------
    // LAN/Network config tools (issue #38)
    // -------------------------------------------------------------------------

    describe('getLanNetworkListV2', () => {
        it('should get LAN network list v2 with pagination', async () => {
            const mockData = { data: [{ id: 'net-1' }], totalRows: 1 };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getLanNetworkListV2(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v2/test-omadac/sites/site-123/lan-networks', { page: 1, pageSize: 10 }, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getInterfaceLanNetwork', () => {
        it('should get interface LAN network bindings', async () => {
            const mockData = { interfaces: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getInterfaceLanNetwork(1, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/lan-networks/interface', { type: 1 }, undefined);
            expect(result).toEqual(mockData);
        });

        it('should omit type param when not provided', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getInterfaceLanNetwork(undefined, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/lan-networks/interface', undefined, undefined);
        });
    });

    describe('getInterfaceLanNetworkV2', () => {
        it('should get interface LAN network bindings v2', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getInterfaceLanNetworkV2(0, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v2/test-omadac/sites/site-123/lan-networks/interface', { type: 0 }, undefined);
        });
    });

    describe('getGridPolicyRouting', () => {
        it('should get policy routing rules', async () => {
            const mockData = { data: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getGridPolicyRouting(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/routing/policy-routings',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('getStaticRoutingInterfaceList', () => {
        it('should get static routing interfaces', async () => {
            const mockData = [{ name: 'WAN1' }];
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getStaticRoutingInterfaceList('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/routing/static-routings/interfaces',
                undefined,
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('getGridOtoNats', () => {
        it('should get 1:1 NAT rules', async () => {
            const mockData = { data: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getGridOtoNats(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/nat/one-to-one-nat',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('getAlg', () => {
        it('should get ALG config', async () => {
            const mockData = { sipEnabled: true };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getAlg('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/nat/alg', undefined, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getUpnpSetting', () => {
        it('should get UPnP setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getUpnpSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/upnp', undefined, undefined);
            expect(result).toEqual({ enabled: true });
        });
    });

    describe('getDdnsGrid', () => {
        it('should get DDNS entries', async () => {
            const mockData = { data: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getDdnsGrid(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/service/ddns',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('getDhcpReservationGrid', () => {
        it('should get DHCP reservations', async () => {
            const mockData = { data: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getDhcpReservationGrid(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/service/dhcp',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('getGridIpMacBinding', () => {
        it('should get IP-MAC binding entries', async () => {
            const mockData = { data: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getGridIpMacBinding(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/ip-mac-binds', { page: 1, pageSize: 10 }, undefined);
            expect(result).toEqual(mockData);
        });
    });

    describe('getIpMacBindingGeneralSetting', () => {
        it('should get IP-MAC binding global toggle', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: false } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getIpMacBindingGeneralSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/ip-mac-bind', undefined, undefined);
            expect(result).toEqual({ enabled: false });
        });
    });

    describe('getSnmpSetting', () => {
        it('should get SNMP config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { version: 'v2c' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getSnmpSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/service/snmp', undefined, undefined);
            expect(result).toEqual({ version: 'v2c' });
        });
    });

    describe('getLldpSetting', () => {
        it('should get LLDP global setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getLldpSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/lldp', undefined, undefined);
            expect(result).toEqual({ enabled: true });
        });
    });

    describe('getRemoteLoggingSetting', () => {
        it('should get remote logging config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { server: '10.0.0.1', port: 514 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getRemoteLoggingSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/remote-logging', undefined, undefined);
            expect(result).toEqual({ server: '10.0.0.1', port: 514 });
        });
    });

    describe('getSessionLimit', () => {
        it('should get session limit global setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getSessionLimit('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/session-limit', undefined, undefined);
            expect(result).toEqual({ enabled: true });
        });
    });

    describe('getGridSessionLimitRule', () => {
        it('should get session limit rules', async () => {
            const mockData = { data: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getGridSessionLimitRule(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/session-limit/rules',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('getGridBandwidthCtrlRule', () => {
        it('should get bandwidth control rules', async () => {
            const mockData = { data: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getGridBandwidthCtrlRule(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/bandwidth-control/rules',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('getAccessControl', () => {
        it('should get controller access control config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { allowedRanges: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getAccessControl('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/access-control', undefined, undefined);
            expect(result).toEqual({ allowedRanges: [] });
        });
    });

    describe('getDnsCacheSetting', () => {
        it('should get DNS cache setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: true, ttl: 300 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getDnsCacheSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/service/dns-cache', undefined, undefined);
            expect(result).toEqual({ enabled: true, ttl: 300 });
        });
    });

    describe('getDnsProxy', () => {
        it('should get DNS proxy config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getDnsProxy('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/service/dns-proxy', undefined, undefined);
            expect(result).toEqual({ enabled: true });
        });
    });

    describe('getIgmp', () => {
        it('should get IGMP setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { snoopingEnabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getIgmp('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/service/igmp', undefined, undefined);
            expect(result).toEqual({ snoopingEnabled: true });
        });
    });

    describe('getInternetLoadBalance', () => {
        it('should get WAN load balancing config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { mode: 'loadBalance' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getInternetLoadBalance('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/internet/load-balance', undefined, undefined);
            expect(result).toEqual({ mode: 'loadBalance' });
        });
    });

    describe('getWanPortsConfig', () => {
        it('should get WAN port settings', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { ports: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getWanPortsConfig('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/internet/ports-config', undefined, undefined);
            expect(result).toEqual({ ports: [] });
        });
    });

    describe('getInternetBasicPortInfo', () => {
        it('should get WAN port summary', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { wan1: 'connected' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getInternetBasicPortInfo('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/internet/basic-info', undefined, undefined);
            expect(result).toEqual({ wan1: 'connected' });
        });
    });

    describe('getInternet', () => {
        it('should get full WAN/Internet configuration', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { connectionType: 'dhcp' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getInternet('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/internet', undefined, undefined);
            expect(result).toEqual({ connectionType: 'dhcp' });
        });
    });

    describe('getGridVirtualWan', () => {
        it('should get virtual WAN list', async () => {
            const mockData = { data: [] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getGridVirtualWan(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/virtual-wans',
                { page: 1, pageSize: 10 },
                undefined
            );
            expect(result).toEqual(mockData);
        });
    });

    describe('getSsidsBySite', () => {
        it('should get flat SSID list by device type', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getSsidsBySite(1, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/wireless-network/ssids', { type: 1 }, undefined);
        });
    });

    describe('getRadioFrequencyPlanningConfig', () => {
        it('should get RF planning config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getRadioFrequencyPlanningConfig('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/rfPlanning', undefined, undefined);
        });
    });

    describe('getRadioFrequencyPlanningResult', () => {
        it('should get RF planning result', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getRadioFrequencyPlanningResult('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/rfPlanning/result', undefined, undefined);
        });
    });

    describe('getBandSteeringSetting', () => {
        it('should get band steering config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getBandSteeringSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/band-steering', undefined, undefined);
        });
    });

    describe('getBeaconControlSetting', () => {
        it('should get beacon control setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getBeaconControlSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/beacon-control', undefined, undefined);
        });
    });

    describe('getChannelLimitSetting', () => {
        it('should get channel limit setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getChannelLimitSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/channel-limit', undefined, undefined);
        });
    });

    describe('getMeshSetting', () => {
        it('should get mesh config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getMeshSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/mesh', undefined, undefined);
        });
    });

    describe('getRoamingSetting', () => {
        it('should get roaming config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getRoamingSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/roaming', undefined, undefined);
        });
    });

    describe('getOuiProfileList', () => {
        it('should get OUI profile list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getOuiProfileList(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/oui-profiles', { page: 1, pageSize: 10 }, undefined);
        });
    });

    describe('getMacAuthSetting', () => {
        it('should get MAC auth setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getMacAuthSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/mac-auth', undefined, undefined);
        });
    });

    describe('getMacAuthSsids', () => {
        it('should get per-SSID MAC auth settings', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getMacAuthSsids('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/mac-auth/ssids', undefined, undefined);
        });
    });

    describe('getMacFilteringGeneralSetting', () => {
        it('should get MAC filtering global setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getMacFilteringGeneralSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/mac-filter', undefined, undefined);
        });
    });

    describe('getGridAllowMacFiltering', () => {
        it('should get MAC allow-list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridAllowMacFiltering(1, 20, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/mac-filters/allow',
                { page: 1, pageSize: 20 },
                undefined
            );
        });
    });

    describe('getGridDenyMacFiltering', () => {
        it('should get MAC deny-list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridDenyMacFiltering(1, 20, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/mac-filters/deny',
                { page: 1, pageSize: 20 },
                undefined
            );
        });
    });

    describe('getSwitchDot1xSetting', () => {
        it('should get 802.1X switch setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getSwitchDot1xSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/dot1x', undefined, undefined);
        });
    });

    describe('getEapDot1xSetting', () => {
        it('should get 802.1X EAP setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getEapDot1xSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/dot1x/eap', undefined, undefined);
        });
    });

    describe('getAclConfigTypeSetting', () => {
        it('should get ACL config type setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getAclConfigTypeSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osg-config-mode', undefined, undefined);
        });
    });

    describe('getOsgCustomAclList', () => {
        it('should get custom gateway ACL list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getOsgCustomAclList(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/acls/osg-custom-acls',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getOswAclList', () => {
        it('should get switch ACL list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getOswAclList(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/acls/osw-acls',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getIpsConfig', () => {
        it('should get IPS global config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getIpsConfig('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/network-security/ips', undefined, undefined);
        });
    });

    describe('getGridSignature', () => {
        it('should get IPS signature list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridSignature(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/network-security/ips/signature',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getGridAllowList', () => {
        it('should get IPS allow list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridAllowList(1, 10, undefined, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/network-security/ips/grid/allow-list',
                { page: 1, pageSize: 10 },
                undefined
            );
        });

        it('should include searchKey when provided', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridAllowList(1, 10, 'safe.com', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/network-security/ips/grid/allow-list',
                { page: 1, pageSize: 10, searchKey: 'safe.com' },
                undefined
            );
        });
    });

    describe('getGridBlockList', () => {
        it('should get IPS block list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridBlockList(1, 10, undefined, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/network-security/ips/grid/block-list',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getAttackDefenseSetting', () => {
        it('should get attack defense config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getAttackDefenseSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/attack-defense', undefined, undefined);
        });
    });

    describe('getUrlFilterGeneral', () => {
        it('should get URL filter global setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getUrlFilterGeneral('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/url-filters/globalUrlFilter', undefined, undefined);
        });
    });

    describe('getGridGatewayRule', () => {
        it('should get URL filter gateway rules with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridGatewayRule(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/url-filters/gateway',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getGridEapRule', () => {
        it('should get URL filter AP rules with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridEapRule(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/url-filters/eap',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });
});
