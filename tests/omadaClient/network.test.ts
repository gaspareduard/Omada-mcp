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
            post: vi.fn(),
            put: vi.fn(),
            patch: vi.fn(),
            delete: vi.fn(),
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

    describe('DHCP reservation mutations', () => {
        it('should create a DHCP reservation', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { success: true },
            };

            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = {
                mac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.20',
            };

            const result = await networkOps.createDhcpReservation(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/service/dhcp', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should update a DHCP reservation', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { success: true },
            };

            vi.mocked(mockRequest.patch).mockResolvedValue(mockResponse);

            const payload = {
                mac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: false,
            };

            const result = await networkOps.updateDhcpReservation('AA:BB:CC:DD:EE:FF', payload, 'site-123');

            expect(mockRequest.patch).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/service/dhcp/AA%3ABB%3ACC%3ADD%3AEE%3AFF',
                payload,
                undefined
            );
            expect(result).toEqual({ success: true });
        });

        it('should add the reservation MAC to the PATCH payload when omitted', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { success: true },
            };

            vi.mocked(mockRequest.patch).mockResolvedValue(mockResponse);

            const payload = {
                netId: 'net-1',
                status: false,
            };

            await networkOps.updateDhcpReservation('AA:BB:CC:DD:EE:FF', payload, 'site-123');

            expect(mockRequest.patch).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/service/dhcp/AA%3ABB%3ACC%3ADD%3AEE%3AFF',
                { ...payload, mac: 'AA:BB:CC:DD:EE:FF' },
                undefined
            );
        });

        it('should require a reservation MAC for update', async () => {
            await expect(networkOps.updateDhcpReservation('', { netId: 'net-1', status: true }, 'site-123')).rejects.toThrow(
                'A reservation MAC address must be provided.'
            );
        });

        it('should delete a DHCP reservation', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { success: true },
            };

            vi.mocked(mockRequest.delete).mockResolvedValue(mockResponse);

            const result = await networkOps.deleteDhcpReservation('AA:BB:CC:DD:EE:FF', 'site-123');

            expect(mockRequest.delete).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/service/dhcp/AA%3ABB%3ACC%3ADD%3AEE%3AFF',
                undefined
            );
            expect(result).toEqual({ success: true });
        });

        it('should require a reservation MAC for delete', async () => {
            await expect(networkOps.deleteDhcpReservation('', 'site-123')).rejects.toThrow('A reservation MAC address must be provided.');
        });
    });

    describe('ACL mutations', () => {
        it('should create a gateway ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { description: 'Allow IoT' };
            const result = await networkOps.createOsgAcl(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osg-acls', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should update a gateway ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.put).mockResolvedValue(mockResponse);

            const payload = { description: 'Updated ACL' };
            const result = await networkOps.updateOsgAcl('acl-1', payload, 'site-123');

            expect(mockRequest.put).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osg-acls/acl-1', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should throw when updating a gateway ACL without aclId', async () => {
            await expect(networkOps.updateOsgAcl('', { description: 'bad' }, 'site-123')).rejects.toThrow('aclId is required.');
        });

        it('should create an EAP ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { name: 'Guest WLAN ACL' };
            const result = await networkOps.createEapAcl(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/eap-acls', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should update an EAP ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.put).mockResolvedValue(mockResponse);

            const payload = { name: 'Updated WLAN ACL' };
            const result = await networkOps.updateEapAcl('acl-2', payload, 'site-123');

            expect(mockRequest.put).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/eap-acls/acl-2', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should delete an ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.delete).mockResolvedValue(mockResponse);

            const result = await networkOps.deleteAcl('acl-1', 'site-123');

            expect(mockRequest.delete).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/acl-1', undefined);
            expect(result).toEqual({ success: true });
        });
    });

    describe('policy and traffic mutations', () => {
        it('should create a bandwidth control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { name: 'Guests limit' };
            const result = await networkOps.createBandwidthCtrlRule(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/bandwidth-control/rules', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should update a bandwidth control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.patch).mockResolvedValue(mockResponse);

            const payload = { rateLimit: 100 };
            const result = await networkOps.updateBandwidthCtrlRule('rule-1', payload, 'site-123');

            expect(mockRequest.patch).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/bandwidth-control/rules/rule-1',
                payload,
                undefined
            );
            expect(result).toEqual({ success: true });
        });

        it('should delete a bandwidth control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.delete).mockResolvedValue(mockResponse);

            const result = await networkOps.deleteBandwidthCtrlRule('rule-1', 'site-123');

            expect(mockRequest.delete).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/bandwidth-control/rules/rule-1', undefined);
            expect(result).toEqual({ success: true });
        });

        it('should update access control settings', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.patch).mockResolvedValue(mockResponse);

            const payload = { mode: 'allow-list' };
            const result = await networkOps.setAccessControl(payload, 'site-123');

            expect(mockRequest.patch).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/access-control', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should update ACL config mode settings', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.put).mockResolvedValue(mockResponse);

            const payload = { mode: 1 };
            const result = await networkOps.setAclConfigTypeSetting(payload, 'site-123');

            expect(mockRequest.put).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osg-config-mode', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should create an application control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { name: 'Block social media' };
            const result = await networkOps.createAppControlRule(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/applicationControl/rules', payload, undefined);
            expect(result).toEqual({ success: true });
        });

        it('should update an application control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.put).mockResolvedValue(mockResponse);

            const payload = { enable: false };
            const result = await networkOps.updateAppControlRule('rule-2', payload, 'site-123');

            expect(mockRequest.put).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/applicationControl/rules/rule-2',
                payload,
                undefined
            );
            expect(result).toEqual({ success: true });
        });

        it('should delete an application control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { success: true } };
            vi.mocked(mockRequest.delete).mockResolvedValue(mockResponse);

            const result = await networkOps.deleteAppControlRule('rule-2', 'site-123');

            expect(mockRequest.delete).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/applicationControl/rules/rule-2', undefined);
            expect(result).toEqual({ success: true });
        });
    });

    describe('ACL and policy mutations', () => {
        it('should create a gateway ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { id: 'acl-1' },
            };

            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { description: 'Guests block', status: true };
            const result = await networkOps.createOsgAcl(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osg-acls', payload, undefined);
            expect(result).toEqual({ id: 'acl-1' });
        });

        it('should update a gateway ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ok: true },
            };

            vi.mocked(mockRequest.put).mockResolvedValue(mockResponse);

            const payload = { description: 'Updated guests block', status: false };
            const result = await networkOps.updateOsgAcl('acl-1', payload, 'site-123');

            expect(mockRequest.put).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osg-acls/acl-1', payload, undefined);
            expect(result).toEqual({ ok: true });
        });

        it('should create an EAP ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { id: 'eap-acl-1' },
            };

            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { description: 'Wireless guest rule', status: true };
            const result = await networkOps.createEapAcl(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/eap-acls', payload, undefined);
            expect(result).toEqual({ id: 'eap-acl-1' });
        });

        it('should update an EAP ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ok: true },
            };

            vi.mocked(mockRequest.put).mockResolvedValue(mockResponse);

            const payload = { description: 'Updated wireless guest rule', status: false };
            const result = await networkOps.updateEapAcl('acl-2', payload, 'site-123');

            expect(mockRequest.put).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/eap-acls/acl-2', payload, undefined);
            expect(result).toEqual({ ok: true });
        });

        it('should create a switch ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { id: 'osw-acl-1' },
            };

            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { description: 'Switch block rule', status: true };
            const result = await networkOps.createOswAcl(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osw-acls', payload, undefined);
            expect(result).toEqual({ id: 'osw-acl-1' });
        });

        it('should update a switch ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ok: true },
            };

            vi.mocked(mockRequest.put).mockResolvedValue(mockResponse);

            const payload = { description: 'Updated switch block rule', status: false };
            const result = await networkOps.updateOswAcl('osw-acl-1', payload, 'site-123');

            expect(mockRequest.put).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/osw-acls/osw-acl-1', payload, undefined);
            expect(result).toEqual({ ok: true });
        });

        it('should throw when updating a switch ACL without aclId', async () => {
            await expect(networkOps.updateOswAcl('', { description: 'bad' }, 'site-123')).rejects.toThrow('aclId is required.');
        });

        it('should delete an ACL rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ok: true },
            };

            vi.mocked(mockRequest.delete).mockResolvedValue(mockResponse);

            const result = await networkOps.deleteAcl('acl-3', 'site-123');

            expect(mockRequest.delete).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/acls/acl-3', undefined);
            expect(result).toEqual({ ok: true });
        });

        it('should create a bandwidth control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { id: 'bw-1' },
            };

            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { name: 'Guests limit', status: true };
            const result = await networkOps.createBandwidthCtrlRule(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/bandwidth-control/rules', payload, undefined);
            expect(result).toEqual({ id: 'bw-1' });
        });

        it('should update a bandwidth control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ok: true },
            };

            vi.mocked(mockRequest.patch).mockResolvedValue(mockResponse);

            const payload = { name: 'Guests limit updated', status: false };
            const result = await networkOps.updateBandwidthCtrlRule('bw-1', payload, 'site-123');

            expect(mockRequest.patch).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/bandwidth-control/rules/bw-1', payload, undefined);
            expect(result).toEqual({ ok: true });
        });

        it('should delete a bandwidth control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ok: true },
            };

            vi.mocked(mockRequest.delete).mockResolvedValue(mockResponse);

            const result = await networkOps.deleteBandwidthCtrlRule('bw-2', 'site-123');

            expect(mockRequest.delete).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/bandwidth-control/rules/bw-2', undefined);
            expect(result).toEqual({ ok: true });
        });

        it('should update site access control settings', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { preAuthAccessEnable: true },
            };

            vi.mocked(mockRequest.patch).mockResolvedValue(mockResponse);

            const payload = {
                preAuthAccessEnable: true,
                preAuthAccessPolicies: [{ type: 2, url: 'example.com' }],
                freeAuthClientEnable: false,
            };
            const result = await networkOps.setAccessControl(payload, 'site-123');

            expect(mockRequest.patch).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/access-control', payload, undefined);
            expect(result).toEqual({ preAuthAccessEnable: true });
        });

        it('should create an application control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ruleId: 9 },
            };

            vi.mocked(mockRequest.post).mockResolvedValue(mockResponse);

            const payload = { ruleName: 'Block apps', schedule: 'always', qos: false, applications: [101], selectType: 'include' };
            const result = await networkOps.createAppControlRule(payload, 'site-123');

            expect(mockRequest.post).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/applicationControl/rules', payload, undefined);
            expect(result).toEqual({ ruleId: 9 });
        });

        it('should update an application control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ruleId: 9 },
            };

            vi.mocked(mockRequest.put).mockResolvedValue(mockResponse);

            const payload = {
                ruleName: 'Block apps updated',
                schedule: 'always',
                qos: true,
                qosClass: 1,
                applications: [101],
                selectType: 'exclude',
            };
            const result = await networkOps.updateAppControlRule('9', payload, 'site-123');

            expect(mockRequest.put).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/applicationControl/rules/9', payload, undefined);
            expect(result).toEqual({ ruleId: 9 });
        });

        it('should delete an application control rule', async () => {
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: { ok: true },
            };

            vi.mocked(mockRequest.delete).mockResolvedValue(mockResponse);

            const result = await networkOps.deleteAppControlRule('9', 'site-123');

            expect(mockRequest.delete).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/applicationControl/rules/9', undefined);
            expect(result).toEqual({ ok: true });
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

        it('should patch firewall settings for a site', async () => {
            const mockData = { aclEnabled: false };
            const mockResponse: OmadaApiResponse<unknown> = {
                errorCode: 0,
                result: mockData,
            };

            vi.mocked(mockRequest.patch).mockResolvedValue(mockResponse);

            const result = await networkOps.setFirewallSetting({ aclEnabled: false }, 'site-123');

            expect(mockRequest.patch).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/firewall', { aclEnabled: false }, undefined);
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

    describe('getSiteToSiteVpnInfo', () => {
        it('should get single site-to-site VPN by ID', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { id: 'vpn-001' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getSiteToSiteVpnInfo('vpn-001', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/site-to-site-vpns/vpn-001',
                undefined,
                undefined
            );
        });
    });

    describe('listWireguard', () => {
        it('should list WireGuard tunnels with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.listWireguard(1, 10, undefined, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/wireguards',
                { page: 1, pageSize: 10 },
                undefined
            );
        });

        it('should include searchKey when provided', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.listWireguard(1, 10, 'wg0', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/wireguards',
                { page: 1, pageSize: 10, searchKey: 'wg0' },
                undefined
            );
        });
    });

    describe('listWireguardPeers', () => {
        it('should list WireGuard peers with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.listWireguardPeers(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/wireguard-peers',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getWireguardSummary', () => {
        it('should get WireGuard summary', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getWireguardSummary('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/vpn/wireguard-summarys', undefined, undefined);
        });
    });

    describe('listClientToSiteVpnClients', () => {
        it('should list C2S VPN clients', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [], supportL2tp: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.listClientToSiteVpnClients('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/client-to-site-vpn-clients',
                undefined,
                undefined
            );
        });
    });

    describe('getClientToSiteVpnServerInfo', () => {
        it('should get single C2S VPN server by ID', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { id: 'srv-001' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getClientToSiteVpnServerInfo('srv-001', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/client-to-site-vpn-servers/srv-001',
                undefined,
                undefined
            );
        });
    });

    describe('getSslVpnServerSetting', () => {
        it('should get SSL VPN server config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getSslVpnServerSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/vpn/ssl-vpn-server/setting', undefined, undefined);
        });
    });

    describe('getGridIpsecFailover', () => {
        it('should get IPsec failover config with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGridIpsecFailover(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/ipsec_failovers',
                { page: 1, pageSize: 10 },
                undefined
            );
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

    describe('getPortForwardingListPage', () => {
        it('should get a single page of port forwarding rules', async () => {
            const mockData = { data: [{ id: 'rule-1', externalPort: 80 }], totalRows: 1 };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);

            const result = await networkOps.getPortForwardingListPage(1, 10, 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/nat/port-forwardings',
                { page: 1, pageSize: 10 },
                undefined
            );
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

    describe('getGridStaticRouting', () => {
        it('should get static routing rules with pagination', async () => {
            const mockData = { data: [{ id: 'r1', destination: '10.0.0.0/8' }], totalRows: 1 };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getGridStaticRouting(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/routing/static-routings',
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

    describe('getApplications', () => {
        it('should get application control applications with optional filters', async () => {
            const mockData = { data: [{ applicationId: 1001 }] };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockData };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getApplications(2, 50, 'zoom', 2048, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/applicationControl/applications',
                { page: 2, pageSize: 50, searchKey: 'zoom', filtersFamilyId: 2048 },
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

    describe('listServiceType', () => {
        it('should list service type profiles with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.listServiceType(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/profiles/service-type',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getServiceTypeSummary', () => {
        it('should get service type summary', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getServiceTypeSummary('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/profiles/service-type-summary',
                undefined,
                undefined
            );
        });
    });

    describe('getGroupProfilesByType', () => {
        it('should get group profiles by type', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGroupProfilesByType('ip', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/profiles/groups/ip', undefined, undefined);
        });
    });

    describe('getLdapProfileList', () => {
        it('should list LDAP profiles', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getLdapProfileList('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/profiles/ldap', undefined, undefined);
        });
    });

    describe('getRadiusUserList', () => {
        it('should list RADIUS users with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getRadiusUserList(1, 10, undefined, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/profiles/radius-server/users',
                { page: 1, pageSize: 10 },
                undefined
            );
        });

        it('should include sorts.username when provided', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getRadiusUserList(1, 10, 'asc', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/profiles/radius-server/users',
                { page: 1, pageSize: 10, 'sorts.username': 'asc' },
                undefined
            );
        });
    });

    describe('getPPSKProfiles', () => {
        it('should get PPSK profiles by type', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getPPSKProfiles(1, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/ppsk-profiles', { type: 1 }, undefined);
        });
    });

    describe('listMdnsProfile', () => {
        it('should list Bonjour/mDNS service profiles', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.listMdnsProfile('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/profiles/bonjour-service', undefined, undefined);
        });
    });

    // --- network-wan additions (#74) ---

    describe('getIspBandScan', () => {
        it('should fetch ISP band scan for a port', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { bands: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getIspBandScan('port-uuid-1', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/internet/band-scan/port-uuid-1',
                undefined,
                undefined
            );
        });
    });

    describe('getDisableNatList', () => {
        it('should fetch disable NAT list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { totalRows: 0, data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getDisableNatList(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/wired-networks/disable-nats',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getLtePortConfig', () => {
        it('should fetch LTE port config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getLtePortConfig('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/internet/lte/ports-config', undefined, undefined);
        });
    });

    describe('getWanPortDetail', () => {
        it('should fetch WAN port detail', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getWanPortDetail('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/internet/ports-config', undefined, undefined);
        });
    });

    describe('getWanIspProfile', () => {
        it('should fetch WAN ISP profile for a port', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getWanIspProfile('port-uuid-2', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/internet/isp-scan/port-uuid-2',
                undefined,
                undefined
            );
        });
    });

    describe('getWanQosConfig', () => {
        it('should fetch WAN QoS config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getWanQosConfig('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/qos/gateway/wans', undefined, undefined);
        });
    });

    describe('getWanUsageStats', () => {
        it('should fetch WAN usage stats', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getWanUsageStats('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/dashboard/traffic-activities', undefined, undefined);
        });
    });

    describe('getWanNatConfig', () => {
        it('should fetch WAN NAT config with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getWanNatConfig(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/nat/one-to-one-nat',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    // --- network-lan additions (#74) ---

    describe('getSwitchVlanInterface', () => {
        it('should fetch switch VLAN interface config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getSwitchVlanInterface('AA-BB-CC-DD-EE-FF', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vlan-interface/switches/AA-BB-CC-DD-EE-FF',
                undefined,
                undefined
            );
        });
    });

    describe('getLanDnsRules', () => {
        it('should fetch LAN DNS rules', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getLanDnsRules(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/lan/dns',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getLanProfileEsUsage', () => {
        it('should fetch LAN profile ES usage', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getLanProfileEsUsage('profile-1', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/lan-profiles/profile-1/es', undefined, undefined);
        });
    });

    describe('getLanClientCount', () => {
        it('should fetch LAN client distribution', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getLanClientCount('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/dashboard/client-distribution',
                undefined,
                undefined
            );
        });
    });

    // --- network-routing additions (#74) ---

    describe('getOspfProcess', () => {
        it('should fetch OSPF process config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getOspfProcess('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/ospf/process', undefined, undefined);
        });
    });

    describe('getOspfInterface', () => {
        it('should fetch OSPF interface config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getOspfInterface('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/ospf/interface', undefined, undefined);
        });
    });

    describe('getVrrpConfig', () => {
        it('should fetch VRRP config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getVrrpConfig('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/osw-vrrp', undefined, undefined);
        });
    });

    describe('getOspfNeighbors', () => {
        it('should fetch OSPF neighbor devices', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getOspfNeighbors('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/ospf/device', undefined, undefined);
        });
    });

    // --- network-services additions (#74) ---

    describe('getDnsCacheDataList', () => {
        it('should fetch DNS cache data list', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getDnsCacheDataList(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/setting/dns-cache-data',
                { page: 1, pageSize: 10 },
                undefined
            );
        });
    });

    describe('getIptvSetting', () => {
        it('should fetch IPTV setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getIptvSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/service/iptv', undefined, undefined);
        });
    });

    describe('getNtpSetting', () => {
        it('should fetch NTP setting', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getNtpSetting('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/setting/ntp', undefined, undefined);
        });
    });

    // security-vpn additions (#75)

    describe('getRadiusProxyConfig', () => {
        it('should fetch global RADIUS proxy config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getRadiusProxyConfig();
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/global/controller/setting/network/radius-proxy',
                undefined,
                undefined
            );
            expect(result).toEqual({ enabled: true });
        });

        it('should pass custom headers', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const headers = { 'X-Test': 'value' };
            await networkOps.getRadiusProxyConfig(headers);
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, headers);
        });
    });

    describe('getGatewayQosClassRules', () => {
        it('should fetch gateway QoS class rules with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGatewayQosClassRules(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/qos/gateway/class-rules',
                { page: 1, pageSize: 10 },
                undefined
            );
        });

        it('should use default site when siteId is not provided', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getGatewayQosClassRules();
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
        });
    });

    describe('getBandwidthCtrlDetail', () => {
        it('should fetch bandwidth control detail', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: false } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getBandwidthCtrlDetail('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/qos/gateway/bwcs', undefined, undefined);
            expect(result).toEqual({ enabled: false });
        });
    });

    describe('getAppControlRules', () => {
        it('should fetch application control rules with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getAppControlRules(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/applicationControl/rules',
                { page: 1, pageSize: 10 },
                undefined
            );
        });

        it('should use default pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getAppControlRules(undefined, undefined, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), { page: 1, pageSize: 10 }, undefined);
        });
    });

    describe('getAppControlCategories', () => {
        it('should fetch application control categories', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getAppControlCategories('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/applicationControl/families', undefined, undefined);
            expect(result).toEqual([]);
        });
    });

    describe('getQosPolicy', () => {
        it('should fetch QoS policy', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { enabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getQosPolicy('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/qos/gateway/tag-outbound-traffic',
                undefined,
                undefined
            );
        });
    });

    describe('getTrafficPriority', () => {
        it('should fetch traffic priority settings', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getTrafficPriority('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/qos/gateway/voip-prioritization',
                undefined,
                undefined
            );
        });
    });

    describe('getVpnUserList', () => {
        it('should fetch VPN user list with pagination', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getVpnUserList(1, 10, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/vpn/users', { page: 1, pageSize: 10 }, undefined);
        });
    });

    describe('getVpnUserDetail', () => {
        it('should fetch VPN users for a specific VPN server', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { users: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getVpnUserDetail('vpn-001', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/vpn/client-to-site-vpn-servers/vpn-001/users',
                undefined,
                undefined
            );
        });

        it('should encode vpnId in URL', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getVpnUserDetail('vpn id/special', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(expect.stringContaining('vpn%20id%2Fspecial'), undefined, undefined);
        });
    });

    describe('getGoogleLdapProfile', () => {
        it('should fetch Google LDAP profile', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { domain: 'example.com' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getGoogleLdapProfile('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/profiles/ldap/google', undefined, undefined);
            expect(result).toEqual({ domain: 'example.com' });
        });
    });

    describe('getPpskUserGroup', () => {
        it('should fetch PPSK user group by profile ID', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { users: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getPpskUserGroup('profile-001', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/ppsk-profile/profile-001', undefined, undefined);
        });

        it('should encode profileId in URL', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await networkOps.getPpskUserGroup('profile/special', 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(expect.stringContaining('profile%2Fspecial'), undefined, undefined);
        });
    });

    describe('getUserRoleProfile', () => {
        it('should fetch user role profiles', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getUserRoleProfile();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/roles', undefined, undefined);
            expect(result).toEqual([]);
        });

        it('should pass custom headers', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const headers = { 'X-Test': 'value' };
            await networkOps.getUserRoleProfile(headers);
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, headers);
        });
    });

    describe('getPortalProfile', () => {
        it('should fetch portal profiles for a site', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: [] };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await networkOps.getPortalProfile('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/portals', undefined, undefined);
            expect(result).toEqual([]);
        });
    });
});
