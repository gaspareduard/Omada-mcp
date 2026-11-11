import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Route tests use pass-through parsers; generated schema behaviour is covered in requestSchemas.test.ts.
const parsed: unknown[] = [];
vi.mock('../../src/omadaClient/requestSchemas.js', () => {
    const passthrough = {
        parse: (value: unknown) => {
            parsed.push(value);
            return value;
        },
    };
    return new Proxy({}, { get: (_target, key) => (key === 'then' ? undefined : passthrough), has: () => true });
});

const { SiteConfigOperations } = await import('../../src/omadaClient/siteConfig.js');

const specs: Record<string, { paths: Record<string, Record<string, unknown>> }> = Object.fromEntries(
    ['03-device', '04-site-setting', '05-client', '06-hotspot'].map((name) => [
        name,
        JSON.parse(readFileSync(new URL(`../../docs/openapi/${name}.json`, import.meta.url), 'utf8')),
    ])
);

const MAC = 'AA-BB-CC-DD-EE-FF';
const body = { marker: true };

type Ops = InstanceType<typeof SiteConfigOperations>;
interface RouteCase {
    method: keyof Ops;
    args: unknown[];
    http: string;
    spec: string;
    route: string; // documented path suffix after /sites/{siteId}
    url: string; // concrete suffix
    version?: 'v2';
    sendsBody: boolean;
}

const cases: RouteCase[] = [
    {
        method: 'createLanNetwork',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/lan-networks',
        url: '/lan-networks',
        version: 'v2',
        sendsBody: true,
    },
    {
        method: 'updateLanNetwork',
        args: ['n1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/lan-networks/{networkId}',
        url: '/lan-networks/n1',
        version: 'v2',
        sendsBody: true,
    },
    {
        method: 'deleteLanNetwork',
        args: ['n1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/lan-networks/{networkId}',
        url: '/lan-networks/n1',
        sendsBody: false,
    },
    {
        method: 'createLanProfile',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/lan-profiles',
        url: '/lan-profiles',
        sendsBody: true,
    },
    {
        method: 'updateLanProfile',
        args: ['p1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/lan-profiles/{profileId}',
        url: '/lan-profiles/p1',
        sendsBody: true,
    },
    {
        method: 'deleteLanProfile',
        args: ['p1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/lan-profiles/{profileId}',
        url: '/lan-profiles/p1',
        sendsBody: false,
    },
    {
        method: 'createWlanGroup',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/wireless-network/wlans',
        url: '/wireless-network/wlans',
        sendsBody: true,
    },
    {
        method: 'updateWlanGroup',
        args: ['w1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/wireless-network/wlans/{wlanId}',
        url: '/wireless-network/wlans/w1',
        sendsBody: true,
    },
    {
        method: 'deleteWlanGroup',
        args: ['w1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/wireless-network/wlans/{wlanId}',
        url: '/wireless-network/wlans/w1',
        sendsBody: false,
    },
    {
        method: 'createSsid',
        args: ['w1', body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/wireless-network/wlans/{wlanId}/ssids',
        url: '/wireless-network/wlans/w1/ssids',
        sendsBody: true,
    },
    {
        method: 'deleteSsid',
        args: ['w1', 's1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/wireless-network/wlans/{wlanId}/ssids/{ssidId}',
        url: '/wireless-network/wlans/w1/ssids/s1',
        sendsBody: false,
    },
    {
        method: 'createGroupProfile',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/profiles/groups',
        url: '/profiles/groups',
        sendsBody: true,
    },
    {
        method: 'updateGroupProfile',
        args: ['0', 'g1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/profiles/groups/{groupType}/{groupId}',
        url: '/profiles/groups/0/g1',
        sendsBody: true,
    },
    {
        method: 'deleteGroupProfile',
        args: ['0', 'g1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/profiles/groups/{groupType}/{groupId}',
        url: '/profiles/groups/0/g1',
        sendsBody: false,
    },
    {
        method: 'createMdnsRule',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/setting/service/mdns',
        url: '/setting/service/mdns',
        sendsBody: true,
    },
    {
        method: 'updateMdnsRule',
        args: ['m1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/setting/service/mdns/{mdnsId}',
        url: '/setting/service/mdns/m1',
        sendsBody: true,
    },
    {
        method: 'deleteMdnsRule',
        args: ['m1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/setting/service/mdns/{mdnsId}',
        url: '/setting/service/mdns/m1',
        sendsBody: false,
    },
    {
        method: 'createLanDnsRule',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/setting/lan/dns',
        url: '/setting/lan/dns',
        sendsBody: true,
    },
    {
        method: 'updateLanDnsRule',
        args: ['d1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/setting/lan/dns/{dnsId}',
        url: '/setting/lan/dns/d1',
        sendsBody: true,
    },
    {
        method: 'deleteLanDnsRule',
        args: ['d1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/setting/lan/dns/{dnsId}',
        url: '/setting/lan/dns/d1',
        sendsBody: false,
    },
    {
        method: 'createDdnsEntry',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/setting/service/ddns',
        url: '/setting/service/ddns',
        sendsBody: true,
    },
    {
        method: 'updateDdnsEntry',
        args: ['d1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/setting/service/ddns/{ddnsId}',
        url: '/setting/service/ddns/d1',
        sendsBody: true,
    },
    {
        method: 'deleteDdnsEntry',
        args: ['d1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/setting/service/ddns/{ddnsId}',
        url: '/setting/service/ddns/d1',
        sendsBody: false,
    },
    { method: 'setUpnpSetting', args: [body], http: 'PUT', spec: '04-site-setting', route: '/upnp', url: '/upnp', sendsBody: true },
    { method: 'setAlgSetting', args: [body], http: 'PUT', spec: '04-site-setting', route: '/nat/alg', url: '/nat/alg', sendsBody: true },
    {
        method: 'setSnmpSetting',
        args: [body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/setting/service/snmp',
        url: '/setting/service/snmp',
        sendsBody: true,
    },
    {
        method: 'createPortForwarding',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/nat/port-forwardings',
        url: '/nat/port-forwardings',
        sendsBody: true,
    },
    {
        method: 'updatePortForwarding',
        args: ['f1', body],
        http: 'PUT',
        spec: '04-site-setting',
        route: '/nat/port-forwardings/{portForwardingId}',
        url: '/nat/port-forwardings/f1',
        sendsBody: true,
    },
    {
        method: 'deletePortForwarding',
        args: ['f1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/nat/port-forwardings/{portForwardingId}',
        url: '/nat/port-forwardings/f1',
        sendsBody: false,
    },
    {
        method: 'createOneToOneNat',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/nat/one-to-one-nat',
        url: '/nat/one-to-one-nat',
        sendsBody: true,
    },
    {
        method: 'updateOneToOneNat',
        args: ['o1', body],
        http: 'PUT',
        spec: '04-site-setting',
        route: '/nat/one-to-one-nat/{otonatId}',
        url: '/nat/one-to-one-nat/o1',
        sendsBody: true,
    },
    {
        method: 'deleteOneToOneNat',
        args: ['o1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/nat/one-to-one-nat/{otonatId}',
        url: '/nat/one-to-one-nat/o1',
        sendsBody: false,
    },
    {
        method: 'createStaticRoute',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/routing/static-routings',
        url: '/routing/static-routings',
        sendsBody: true,
    },
    {
        method: 'updateStaticRoute',
        args: ['r1', body],
        http: 'PUT',
        spec: '04-site-setting',
        route: '/routing/static-routings/{staticRoutingId}',
        url: '/routing/static-routings/r1',
        sendsBody: true,
    },
    {
        method: 'deleteStaticRoute',
        args: ['r1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/routing/static-routings/{staticRoutingId}',
        url: '/routing/static-routings/r1',
        sendsBody: false,
    },
    {
        method: 'createPolicyRoute',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/routing/policy-routings',
        url: '/routing/policy-routings',
        sendsBody: true,
    },
    {
        method: 'updatePolicyRoute',
        args: ['r1', body],
        http: 'PUT',
        spec: '04-site-setting',
        route: '/routing/policy-routings/{policyRoutingId}',
        url: '/routing/policy-routings/r1',
        sendsBody: true,
    },
    {
        method: 'deletePolicyRoute',
        args: ['r1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/routing/policy-routings/{policyRoutingId}',
        url: '/routing/policy-routings/r1',
        sendsBody: false,
    },
    {
        method: 'createUrlFilterRule',
        args: [body],
        http: 'POST',
        spec: '04-site-setting',
        route: '/url-filters',
        url: '/url-filters',
        sendsBody: true,
    },
    {
        method: 'updateUrlFilterRule',
        args: ['u1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/url-filters/{ruleId}',
        url: '/url-filters/u1',
        sendsBody: true,
    },
    {
        method: 'deleteUrlFilterRule',
        args: ['u1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/url-filters/{ruleId}',
        url: '/url-filters/u1',
        sendsBody: false,
    },
    {
        method: 'setAttackDefenseSetting',
        args: [body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/attack-defense',
        url: '/attack-defense',
        sendsBody: true,
    },
    {
        method: 'setIpsConfig',
        args: [body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/network-security/ips',
        url: '/network-security/ips',
        sendsBody: true,
    },
    { method: 'createMacFilter', args: [body], http: 'POST', spec: '04-site-setting', route: '/mac-filters', url: '/mac-filters', sendsBody: true },
    {
        method: 'updateMacFilter',
        args: ['x1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/mac-filters/{filterId}',
        url: '/mac-filters/x1',
        sendsBody: true,
    },
    {
        method: 'deleteMacFilter',
        args: ['x1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/mac-filters/{filterId}',
        url: '/mac-filters/x1',
        sendsBody: false,
    },
    {
        method: 'updateSiteToSiteVpn',
        args: ['v1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/vpn/site-to-site-vpns/{vpnId}',
        url: '/vpn/site-to-site-vpns/v1',
        sendsBody: true,
    },
    {
        method: 'deleteSiteToSiteVpn',
        args: ['v1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/vpn/site-to-site-vpns/{vpnId}',
        url: '/vpn/site-to-site-vpns/v1',
        sendsBody: false,
    },
    {
        method: 'updateClientToSiteVpnServer',
        args: ['v1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/vpn/client-to-site-vpn-servers/{vpnId}',
        url: '/vpn/client-to-site-vpn-servers/v1',
        sendsBody: true,
    },
    {
        method: 'deleteClientToSiteVpnServer',
        args: ['v1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/vpn/client-to-site-vpn-servers/{vpnId}',
        url: '/vpn/client-to-site-vpn-servers/v1',
        sendsBody: false,
    },
    {
        method: 'updateClientToSiteVpnClient',
        args: ['v1', body],
        http: 'PATCH',
        spec: '04-site-setting',
        route: '/vpn/client-to-site-vpn-clients/{vpnId}',
        url: '/vpn/client-to-site-vpn-clients/v1',
        sendsBody: true,
    },
    {
        method: 'deleteClientToSiteVpnClient',
        args: ['v1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/vpn/client-to-site-vpn-clients/{vpnId}',
        url: '/vpn/client-to-site-vpn-clients/v1',
        sendsBody: false,
    },
    {
        method: 'updateWireguard',
        args: ['g1', body],
        http: 'PUT',
        spec: '04-site-setting',
        route: '/vpn/wireguards/{id}',
        url: '/vpn/wireguards/g1',
        sendsBody: true,
    },
    {
        method: 'deleteWireguard',
        args: ['g1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/vpn/wireguards/{id}',
        url: '/vpn/wireguards/g1',
        sendsBody: false,
    },
    {
        method: 'deleteWireguardPeer',
        args: ['p1'],
        http: 'DELETE',
        spec: '04-site-setting',
        route: '/vpn/wireguard-peers/{id}',
        url: '/vpn/wireguard-peers/p1',
        sendsBody: false,
    },
    {
        method: 'locateDevice',
        args: [MAC, body],
        http: 'POST',
        spec: '03-device',
        route: '/devices/{deviceMac}/locate',
        url: `/devices/${MAC}/locate`,
        sendsBody: true,
    },
    {
        method: 'forceProvisionDevice',
        args: [MAC],
        http: 'POST',
        spec: '03-device',
        route: '/devices/{deviceMac}/force-provision',
        url: `/devices/${MAC}/force-provision`,
        sendsBody: false,
    },
    {
        method: 'adoptDevice',
        args: [MAC, body],
        http: 'POST',
        spec: '03-device',
        route: '/devices/{deviceMac}/start-adopt',
        url: `/devices/${MAC}/start-adopt`,
        sendsBody: true,
    },
    {
        method: 'startDeviceOnlineUpgrade',
        args: [MAC],
        http: 'POST',
        spec: '03-device',
        route: '/devices/{deviceMac}/start-online-upgrade',
        url: `/devices/${MAC}/start-online-upgrade`,
        sendsBody: false,
    },
    {
        method: 'recoverSwitchPortPoe',
        args: [MAC, body],
        http: 'POST',
        spec: '03-device',
        route: '/switches/{switchMac}/multi-ports/poe-recovery',
        url: `/switches/${MAC}/multi-ports/poe-recovery`,
        sendsBody: true,
    },
    {
        method: 'setClientName',
        args: [MAC, body],
        http: 'PATCH',
        spec: '05-client',
        route: '/clients/{clientMac}/name',
        url: `/clients/${MAC}/name`,
        sendsBody: true,
    },
    {
        method: 'setClientLockToAp',
        args: [MAC, body],
        http: 'POST',
        spec: '05-client',
        route: '/clients/{clientMac}/lock-to-ap',
        url: `/clients/${MAC}/lock-to-ap`,
        sendsBody: true,
    },
    {
        method: 'authorizeHotspotClient',
        args: [MAC],
        http: 'POST',
        spec: '06-hotspot',
        route: '/hotspot/clients/{clientMac}/auth',
        url: `/hotspot/clients/${MAC}/auth`,
        sendsBody: false,
    },
    {
        method: 'unauthorizeHotspotClient',
        args: [MAC],
        http: 'POST',
        spec: '06-hotspot',
        route: '/hotspot/clients/{clientMac}/unauth',
        url: `/hotspot/clients/${MAC}/unauth`,
        sendsBody: false,
    },
    {
        method: 'createVoucherGroup',
        args: [body],
        http: 'POST',
        spec: '06-hotspot',
        route: '/hotspot/voucher-groups',
        url: '/hotspot/voucher-groups',
        sendsBody: true,
    },
    {
        method: 'deleteVoucherGroup',
        args: ['vg1'],
        http: 'DELETE',
        spec: '06-hotspot',
        route: '/hotspot/voucher-groups/{groupId}',
        url: '/hotspot/voucher-groups/vg1',
        sendsBody: false,
    },
];

const listCases: { method: keyof Ops; args: unknown[]; spec: string; route: string; expected?: unknown[] }[] = [
    { method: 'listMdnsRules', args: [], spec: '04-site-setting', route: '/setting/service/mdns' },
    { method: 'listLanDnsRules', args: [], spec: '04-site-setting', route: '/setting/lan/dns' },
    { method: 'listDdnsEntries', args: [], spec: '04-site-setting', route: '/setting/service/ddns' },
    { method: 'listOneToOneNats', args: [], spec: '04-site-setting', route: '/nat/one-to-one-nat' },
    { method: 'listUrlFilterRules', args: ['gateway'], spec: '04-site-setting', route: '/url-filters/gateway' },
    { method: 'listUrlFilterRules', args: ['eap'], spec: '04-site-setting', route: '/url-filters/eap' },
    { method: 'listMacFilters', args: ['allow'], spec: '04-site-setting', route: '/mac-filters/allow', expected: [{ filterMode: 0, id: 'x' }] },
    { method: 'listMacFilters', args: ['deny'], spec: '04-site-setting', route: '/mac-filters/deny', expected: [{ filterMode: 1, id: 'x' }] },
    { method: 'listClientToSiteVpnClientEntries', args: [], spec: '04-site-setting', route: '/vpn/client-to-site-vpn-clients' },
    { method: 'listWireguardTunnels', args: [], spec: '04-site-setting', route: '/vpn/wireguards' },
    { method: 'listWireguardPeerEntries', args: [], spec: '04-site-setting', route: '/vpn/wireguard-peers' },
    { method: 'listVoucherGroups', args: [], spec: '06-hotspot', route: '/hotspot/voucher-groups' },
];

function documented(spec: string, version: string, route: string, http: string): boolean {
    const path = `/openapi/${version}/{omadacId}/sites/{siteId}${route}`;
    return Boolean(specs[spec].paths[path]?.[http.toLowerCase()]);
}

describe('omadaClient/siteConfig', () => {
    const request = {
        request: vi.fn(),
        fetchPaginated: vi.fn(),
        ensureSuccess: vi.fn((value: { result?: unknown }) => value.result),
    };
    const site = { resolveSiteId: vi.fn(async (id?: string) => id ?? 'site-1') };
    const buildPath = vi.fn((path: string, version = 'v1') => `/openapi/${version}/cid${path}`);
    let operations: Ops;

    beforeEach(() => {
        vi.clearAllMocks();
        parsed.length = 0;
        request.request.mockResolvedValue({ errorCode: 0, result: { ok: true } });
        request.fetchPaginated.mockResolvedValue([{ id: 'x' }]);
        operations = new SiteConfigOperations(request as never, site as never, buildPath);
    });

    it.each(cases)('$method sends $http to the documented route', async ({ method, args, http, spec, route, url, version, sendsBody }) => {
        expect(documented(spec, version ?? 'v1', route, http)).toBe(true);

        const fn = operations[method] as (...input: unknown[]) => Promise<unknown>;
        await expect(fn.call(operations, ...args, 'site-9', { 'X-Request-ID': 'r1' })).resolves.toEqual({ ok: true });

        const expectedUrl = `/openapi/${version ?? 'v1'}/cid/sites/site-9${url}`;
        const expectedConfig = sendsBody ? { method: http, url: expectedUrl, data: body } : { method: http, url: expectedUrl };
        expect(request.request).toHaveBeenCalledWith(expectedConfig, true, { 'X-Request-ID': 'r1' });
        if (sendsBody) expect(parsed).toContain(body);
    });

    it.each(listCases)('$method reads every page of $route', async ({ method, args, spec, route, expected }) => {
        expect(documented(spec, 'v1', route, 'GET')).toBe(true);
        const fn = operations[method] as (...input: unknown[]) => Promise<unknown>;
        await expect(fn.call(operations, ...args)).resolves.toEqual(expected ?? [{ id: 'x' }]);
        expect(request.fetchPaginated).toHaveBeenCalledWith(`/openapi/v1/cid/sites/site-1${route}`, {}, undefined);
    });

    it('labels MAC filter entries with the list they were read from', async () => {
        request.fetchPaginated.mockResolvedValueOnce([{ id: 'a' }, { id: 'b', filterMode: 1 }, null]).mockResolvedValueOnce([{ id: 'c' }]);
        await expect(operations.listMacFilters('allow')).resolves.toEqual([{ filterMode: 0, id: 'a' }, { id: 'b', filterMode: 1 }, null]);
        await expect(operations.listMacFilters('deny')).resolves.toEqual([{ filterMode: 1, id: 'c' }]);
    });

    it('rejects blank identifiers, malformed MACs and unknown list selectors before sending', async () => {
        await expect(operations.deleteStaticRoute('  ')).rejects.toThrow('An identifier is required.');
        await expect(operations.locateDevice('not-a-mac', {})).rejects.toThrow('A valid MAC address is required.');
        await expect(operations.deleteGroupProfile('ip', 'g1')).rejects.toThrow('groupType must be the numeric group profile type');
        await expect(operations.listUrlFilterRules('switch' as never)).rejects.toThrow();
        await expect(operations.listMacFilters('maybe' as never)).rejects.toThrow();
        expect(request.request).not.toHaveBeenCalled();
        expect(request.fetchPaginated).not.toHaveBeenCalled();
    });

    it('encodes identifiers into a single path segment', async () => {
        await operations.deleteLanNetwork('a/b');
        expect(request.request).toHaveBeenCalledWith({ method: 'DELETE', url: '/openapi/v1/cid/sites/site-1/lan-networks/a%2Fb' }, true, undefined);
    });

    it('propagates controller rejections from ensureSuccess', async () => {
        request.ensureSuccess.mockImplementationOnce(() => {
            throw new Error('This name already exists in this site.');
        });
        await expect(operations.createStaticRoute(body as never)).rejects.toThrow('This name already exists in this site.');
    });
});
