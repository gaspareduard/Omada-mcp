import { z } from 'zod';

import type { CustomHeaders, OmadaApiResponse } from '../types/index.js';
import type { RequestHandler } from './request.js';
import * as schemas from './requestSchemas.js';
import type { SiteOperations } from './site.js';

type Method = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Input<S extends z.ZodTypeAny> = z.input<S>;

export const urlFilterTypeSchema = z.enum(['gateway', 'eap']);
export const macFilterListSchema = z.enum(['allow', 'deny']);
export const groupProfileTypeSchema = z.string().regex(/^\d+$/, 'groupType must be the numeric group profile type, e.g. "0" for IP groups.');
const macPathSchema = z.string().regex(/^[0-9a-f]{2}([:-][0-9a-f]{2}){5}$/i, 'A valid MAC address is required.');
const idSchema = z.string().trim().min(1, 'An identifier is required.');

/**
 * Site configuration writes and their complete-collection readbacks.
 *
 * Every route is verified against the checked-in tag specs (see
 * tests/omadaClient/siteConfig.test.ts). Request bodies are parsed with the
 * generated strict schemas in requestSchemas.ts before any request is sent.
 */
export class SiteConfigOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string, version?: string) => string
    ) {}

    private async sitePath(siteId: string | undefined, suffix: string, version?: string): Promise<string> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        return this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}${suffix}`, version);
    }

    private async send(
        method: Method,
        siteId: string | undefined,
        suffix: string,
        body: unknown,
        customHeaders?: CustomHeaders,
        version?: string
    ): Promise<unknown> {
        const url = await this.sitePath(siteId, suffix, version);
        const config = body === undefined ? { method, url } : { method, url, data: body };
        return this.request.ensureSuccess(await this.request.request<OmadaApiResponse<unknown>>(config, true, customHeaders));
    }

    private async list(siteId: string | undefined, suffix: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.request.fetchPaginated<unknown>(await this.sitePath(siteId, suffix), {}, customHeaders);
    }

    // ---- LAN networks (v2 create/modify, v1 delete) ----
    public async createLanNetwork(payload: Input<typeof schemas.lanNetworkOpenApiV2VOSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/lan-networks', schemas.lanNetworkOpenApiV2VOSchema.parse(payload), h, 'v2');
    }
    public async updateLanNetwork(
        networkId: string,
        payload: Input<typeof schemas.lanNetworkOpenApiV2VOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        const body = schemas.lanNetworkOpenApiV2VOSchema.parse(payload);
        return await this.send('PATCH', siteId, `/lan-networks/${seg(networkId)}`, body, h, 'v2');
    }
    public async deleteLanNetwork(networkId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/lan-networks/${seg(networkId)}`, undefined, h);
    }

    // ---- LAN (switch port) profiles ----
    public async createLanProfile(
        payload: Input<typeof schemas.lanProfileConfigOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, '/lan-profiles', schemas.lanProfileConfigOpenApiVOSchema.parse(payload), h);
    }
    public async updateLanProfile(
        profileId: string,
        payload: Input<typeof schemas.lanProfileConfigOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/lan-profiles/${seg(profileId)}`, schemas.lanProfileConfigOpenApiVOSchema.parse(payload), h);
    }
    public async deleteLanProfile(profileId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/lan-profiles/${seg(profileId)}`, undefined, h);
    }

    // ---- WLAN groups and SSIDs ----
    public async createWlanGroup(
        payload: Input<typeof schemas.createWlanGroupOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, '/wireless-network/wlans', schemas.createWlanGroupOpenApiVOSchema.parse(payload), h);
    }
    public async updateWlanGroup(
        wlanId: string,
        payload: Input<typeof schemas.updateWlanGroupOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/wireless-network/wlans/${seg(wlanId)}`, schemas.updateWlanGroupOpenApiVOSchema.parse(payload), h);
    }
    public async deleteWlanGroup(wlanId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/wireless-network/wlans/${seg(wlanId)}`, undefined, h);
    }
    public async createSsid(
        wlanId: string,
        payload: Input<typeof schemas.createSsidOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, `/wireless-network/wlans/${seg(wlanId)}/ssids`, schemas.createSsidOpenApiVOSchema.parse(payload), h);
    }
    public async deleteSsid(wlanId: string, ssidId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/wireless-network/wlans/${seg(wlanId)}/ssids/${seg(ssidId)}`, undefined, h);
    }

    // ---- Group profiles (IP, IP-port, MAC, IPv6, country, domain groups) ----
    public async createGroupProfile(payload: Input<typeof schemas.createGroupOpenApiVOSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/profiles/groups', schemas.createGroupOpenApiVOSchema.parse(payload), h);
    }
    public async updateGroupProfile(
        groupType: string,
        groupId: string,
        payload: Input<typeof schemas.createGroupOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        const suffix = `/profiles/groups/${seg(groupProfileTypeSchema.parse(groupType))}/${seg(groupId)}`;
        return await this.send('PATCH', siteId, suffix, schemas.createGroupOpenApiVOSchema.parse(payload), h);
    }
    public async deleteGroupProfile(groupType: string, groupId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/profiles/groups/${seg(groupProfileTypeSchema.parse(groupType))}/${seg(groupId)}`, undefined, h);
    }

    // ---- mDNS reflector rules ----
    public async listMdnsRules(siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, '/setting/service/mdns', h);
    }
    public async createMdnsRule(payload: Input<typeof schemas.createMdnsRuleOpenApiVOSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/setting/service/mdns', schemas.createMdnsRuleOpenApiVOSchema.parse(payload), h);
    }
    public async updateMdnsRule(
        mdnsId: string,
        payload: Input<typeof schemas.createMdnsRuleOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/setting/service/mdns/${seg(mdnsId)}`, schemas.createMdnsRuleOpenApiVOSchema.parse(payload), h);
    }
    public async deleteMdnsRule(mdnsId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/setting/service/mdns/${seg(mdnsId)}`, undefined, h);
    }

    // ---- LAN DNS (local DNS records) ----
    public async listLanDnsRules(siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, '/setting/lan/dns', h);
    }
    public async createLanDnsRule(payload: Input<typeof schemas.lanDnsOpenApiVOSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/setting/lan/dns', schemas.lanDnsOpenApiVOSchema.parse(payload), h);
    }
    public async updateLanDnsRule(
        dnsId: string,
        payload: Input<typeof schemas.lanDnsOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/setting/lan/dns/${seg(dnsId)}`, schemas.lanDnsOpenApiVOSchema.parse(payload), h);
    }
    public async deleteLanDnsRule(dnsId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/setting/lan/dns/${seg(dnsId)}`, undefined, h);
    }

    // ---- Dynamic DNS ----
    public async listDdnsEntries(siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, '/setting/service/ddns', h);
    }
    public async createDdnsEntry(payload: Input<typeof schemas.createDdnsOpenApiVOSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/setting/service/ddns', schemas.createDdnsOpenApiVOSchema.parse(payload), h);
    }
    public async updateDdnsEntry(
        ddnsId: string,
        payload: Input<typeof schemas.createDdnsOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/setting/service/ddns/${seg(ddnsId)}`, schemas.createDdnsOpenApiVOSchema.parse(payload), h);
    }
    public async deleteDdnsEntry(ddnsId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/setting/service/ddns/${seg(ddnsId)}`, undefined, h);
    }

    // ---- Gateway service settings ----
    public async setUpnpSetting(payload: Input<typeof schemas.upnpSettingOpenApiVOSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('PUT', siteId, '/upnp', schemas.upnpSettingOpenApiVOSchema.parse(payload), h);
    }
    public async setAlgSetting(payload: Input<typeof schemas.aLGSettingSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('PUT', siteId, '/nat/alg', schemas.aLGSettingSchema.parse(payload), h);
    }
    public async setSnmpSetting(payload: Input<typeof schemas.snmpSettingOpenApiVOSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('PATCH', siteId, '/setting/service/snmp', schemas.snmpSettingOpenApiVOSchema.parse(payload), h);
    }

    // ---- NAT ----
    public async createPortForwarding(
        payload: Input<typeof schemas.portForwardingConfigSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, '/nat/port-forwardings', schemas.portForwardingConfigSchema.parse(payload), h);
    }
    public async updatePortForwarding(
        portForwardingId: string,
        payload: Input<typeof schemas.portForwardingConfigSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PUT', siteId, `/nat/port-forwardings/${seg(portForwardingId)}`, schemas.portForwardingConfigSchema.parse(payload), h);
    }
    public async deletePortForwarding(portForwardingId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/nat/port-forwardings/${seg(portForwardingId)}`, undefined, h);
    }
    public async listOneToOneNats(siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, '/nat/one-to-one-nat', h);
    }
    public async createOneToOneNat(payload: Input<typeof schemas.otoNatOpenApiVOSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/nat/one-to-one-nat', schemas.otoNatOpenApiVOSchema.parse(payload), h);
    }
    public async updateOneToOneNat(
        otonatId: string,
        payload: Input<typeof schemas.otoNatOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PUT', siteId, `/nat/one-to-one-nat/${seg(otonatId)}`, schemas.otoNatOpenApiVOSchema.parse(payload), h);
    }
    public async deleteOneToOneNat(otonatId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/nat/one-to-one-nat/${seg(otonatId)}`, undefined, h);
    }

    // ---- Routing ----
    public async createStaticRoute(payload: Input<typeof schemas.staticRoutingConfigSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/routing/static-routings', schemas.staticRoutingConfigSchema.parse(payload), h);
    }
    public async updateStaticRoute(
        staticRoutingId: string,
        payload: Input<typeof schemas.staticRoutingConfigSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send(
            'PUT',
            siteId,
            `/routing/static-routings/${seg(staticRoutingId)}`,
            schemas.staticRoutingConfigSchema.parse(payload),
            h
        );
    }
    public async deleteStaticRoute(staticRoutingId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/routing/static-routings/${seg(staticRoutingId)}`, undefined, h);
    }
    public async createPolicyRoute(payload: Input<typeof schemas.policyRoutingConfigSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/routing/policy-routings', schemas.policyRoutingConfigSchema.parse(payload), h);
    }
    public async updatePolicyRoute(
        policyRoutingId: string,
        payload: Input<typeof schemas.policyRoutingConfigSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send(
            'PUT',
            siteId,
            `/routing/policy-routings/${seg(policyRoutingId)}`,
            schemas.policyRoutingConfigSchema.parse(payload),
            h
        );
    }
    public async deletePolicyRoute(policyRoutingId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/routing/policy-routings/${seg(policyRoutingId)}`, undefined, h);
    }

    // ---- URL filtering ----
    public async listUrlFilterRules(type: z.input<typeof urlFilterTypeSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, `/url-filters/${urlFilterTypeSchema.parse(type)}`, h);
    }
    public async createUrlFilterRule(
        payload: Input<typeof schemas.urlFilteringOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, '/url-filters', schemas.urlFilteringOpenApiVOSchema.parse(payload), h);
    }
    public async updateUrlFilterRule(
        ruleId: string,
        payload: Input<typeof schemas.urlFilteringOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/url-filters/${seg(ruleId)}`, schemas.urlFilteringOpenApiVOSchema.parse(payload), h);
    }
    public async deleteUrlFilterRule(ruleId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/url-filters/${seg(ruleId)}`, undefined, h);
    }

    // ---- Security settings ----
    public async setAttackDefenseSetting(
        payload: Input<typeof schemas.attackDefenseSettingSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, '/attack-defense', schemas.attackDefenseSettingSchema.parse(payload), h);
    }
    public async setIpsConfig(payload: Input<typeof schemas.ipsInfoSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('PATCH', siteId, '/network-security/ips', schemas.ipsInfoSchema.parse(payload), h);
    }

    // ---- MAC filtering ----
    public async listMacFilters(list: z.input<typeof macFilterListSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        const mode = macFilterListSchema.parse(list);
        // Entries are read per list without filterMode; restore it so records match the request shape.
        const filterMode = mode === 'allow' ? 0 : 1;
        return (await this.list(siteId, `/mac-filters/${mode}`, h)).map((entry) =>
            entry && typeof entry === 'object' && !('filterMode' in entry) ? { filterMode, ...entry } : entry
        );
    }
    public async createMacFilter(payload: Input<typeof schemas.macFilteringSchema>, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, '/mac-filters', schemas.macFilteringSchema.parse(payload), h);
    }
    public async updateMacFilter(
        filterId: string,
        payload: Input<typeof schemas.macFilteringSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/mac-filters/${seg(filterId)}`, schemas.macFilteringSchema.parse(payload), h);
    }
    public async deleteMacFilter(filterId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/mac-filters/${seg(filterId)}`, undefined, h);
    }

    // ---- VPN ----
    public async deleteSiteToSiteVpn(vpnId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/vpn/site-to-site-vpns/${seg(vpnId)}`, undefined, h);
    }
    public async updateSiteToSiteVpn(
        vpnId: string,
        payload: Input<typeof schemas.siteToSiteVpnSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/vpn/site-to-site-vpns/${seg(vpnId)}`, schemas.siteToSiteVpnSchema.parse(payload), h);
    }
    public async deleteClientToSiteVpnServer(vpnId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/vpn/client-to-site-vpn-servers/${seg(vpnId)}`, undefined, h);
    }
    public async updateClientToSiteVpnServer(
        vpnId: string,
        payload: Input<typeof schemas.clientToSiteVpnServerSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send(
            'PATCH',
            siteId,
            `/vpn/client-to-site-vpn-servers/${seg(vpnId)}`,
            schemas.clientToSiteVpnServerSchema.parse(payload),
            h
        );
    }
    public async deleteClientToSiteVpnClient(vpnId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/vpn/client-to-site-vpn-clients/${seg(vpnId)}`, undefined, h);
    }
    public async updateClientToSiteVpnClient(
        vpnId: string,
        payload: Input<typeof schemas.clientToSiteVpnClientSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send(
            'PATCH',
            siteId,
            `/vpn/client-to-site-vpn-clients/${seg(vpnId)}`,
            schemas.clientToSiteVpnClientSchema.parse(payload),
            h
        );
    }
    public async listClientToSiteVpnClientEntries(siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, '/vpn/client-to-site-vpn-clients', h);
    }
    public async listWireguardTunnels(siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, '/vpn/wireguards', h);
    }
    public async listWireguardPeerEntries(siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, '/vpn/wireguard-peers', h);
    }
    public async updateWireguard(
        id: string,
        payload: Input<typeof schemas.wireguardOpenApiVOSchema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PUT', siteId, `/vpn/wireguards/${seg(id)}`, schemas.wireguardOpenApiVOSchema.parse(payload), h);
    }
    public async deleteWireguard(id: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/vpn/wireguards/${seg(id)}`, undefined, h);
    }
    public async deleteWireguardPeer(id: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/vpn/wireguard-peers/${seg(id)}`, undefined, h);
    }

    // ---- Device actions ----
    public async locateDevice(
        deviceMac: string,
        payload: Input<typeof schemas.locateDeviceRequest03Schema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, `/devices/${mac(deviceMac)}/locate`, schemas.locateDeviceRequest03Schema.parse(payload), h);
    }
    public async forceProvisionDevice(deviceMac: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, `/devices/${mac(deviceMac)}/force-provision`, undefined, h);
    }
    public async adoptDevice(
        deviceMac: string,
        payload: Input<typeof schemas.adoptDeviceRequest03Schema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, `/devices/${mac(deviceMac)}/start-adopt`, schemas.adoptDeviceRequest03Schema.parse(payload), h);
    }
    public async startDeviceOnlineUpgrade(deviceMac: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, `/devices/${mac(deviceMac)}/start-online-upgrade`, undefined, h);
    }
    public async recoverSwitchPortPoe(
        switchMac: string,
        payload: Input<typeof schemas.oswPoeRecoverOpenApiVO03Schema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        const body = schemas.oswPoeRecoverOpenApiVO03Schema.parse(payload);
        return await this.send('POST', siteId, `/switches/${mac(switchMac)}/multi-ports/poe-recovery`, body, h);
    }

    // ---- Client actions ----
    public async setClientName(
        clientMac: string,
        payload: Input<typeof schemas.clientNameSetting05Schema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('PATCH', siteId, `/clients/${mac(clientMac)}/name`, schemas.clientNameSetting05Schema.parse(payload), h);
    }
    public async setClientLockToAp(
        clientMac: string,
        payload: Input<typeof schemas.clientLockToAPSetting05Schema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, `/clients/${mac(clientMac)}/lock-to-ap`, schemas.clientLockToAPSetting05Schema.parse(payload), h);
    }
    public async authorizeHotspotClient(clientMac: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, `/hotspot/clients/${mac(clientMac)}/auth`, undefined, h);
    }
    public async unauthorizeHotspotClient(clientMac: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('POST', siteId, `/hotspot/clients/${mac(clientMac)}/unauth`, undefined, h);
    }

    // ---- Hotspot vouchers ----
    public async listVoucherGroups(siteId?: string, h?: CustomHeaders): Promise<unknown[]> {
        return await this.list(siteId, '/hotspot/voucher-groups', h);
    }
    public async createVoucherGroup(
        payload: Input<typeof schemas.createVoucherGroupOpenApiVO06Schema>,
        siteId?: string,
        h?: CustomHeaders
    ): Promise<unknown> {
        return await this.send('POST', siteId, '/hotspot/voucher-groups', schemas.createVoucherGroupOpenApiVO06Schema.parse(payload), h);
    }
    public async deleteVoucherGroup(groupId: string, siteId?: string, h?: CustomHeaders): Promise<unknown> {
        return await this.send('DELETE', siteId, `/hotspot/voucher-groups/${seg(groupId)}`, undefined, h);
    }
}

function seg(id: string): string {
    return encodeURIComponent(idSchema.parse(id));
}

function mac(value: string): string {
    return encodeURIComponent(macPathSchema.parse(value));
}
