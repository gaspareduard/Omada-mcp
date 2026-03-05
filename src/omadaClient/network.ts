import type { CustomHeaders, OmadaApiResponse, PaginatedResult } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

/**
 * Network-related operations for the Omada API.
 * Covers internet, LAN, WLAN, firewall, and port forwarding configurations.
 */
export class NetworkOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string, version?: string) => string
    ) {}

    /**
     * Get internet configuration info for a site.
     * OperationId: getInternet
     */
    public async getInternetInfo(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/internet`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get port forwarding status for a specific type (User or UPnP).
     * OperationId: getPortForwardStatus
     *
     * @param type - Port forwarding type. The API expects lowercase: 'user' or 'upnp'.
     * @param siteId - Optional site ID (uses default if not provided)
     * @param page - Page number (required by API, default: 1)
     * @param pageSize - Page size (required by API, range: 1-1000, default: 10)
     */
    public async getPortForwardingStatus(
        type: 'user' | 'upnp',
        siteId?: string,
        page = 1,
        pageSize = 10,
        customHeaders?: CustomHeaders
    ): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/port-forwarding/${encodeURIComponent(type)}`);

        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(
            path,
            {
                page,
                pageSize,
            },
            customHeaders
        );

        return this.request.ensureSuccess(response);
    }

    /**
     * Get LAN network list (v2 API) with pagination.
     * OperationId: getLanNetworkListV2
     */
    public async getLanNetworkList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-networks`, 'v2');
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * Get LAN profile list with pagination.
     * OperationId: getLanProfileList
     */
    public async getLanProfileList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-profiles`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * Get WLAN group list.
     * OperationId: getWlanGroupList
     */
    public async getWlanGroupList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get SSID list for a specific WLAN group.
     * OperationId: getSsidList
     *
     * @param wlanId - WLAN group ID (can be obtained from getWlanGroupList)
     */
    public async getSsidList(wlanId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!wlanId) {
            throw new Error('A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans/${encodeURIComponent(wlanId)}/ssids`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * Get detailed information for a specific SSID.
     * OperationId: getSsidDetail
     *
     * @param wlanId - WLAN group ID (can be obtained from getWlanGroupList)
     * @param ssidId - SSID ID (can be obtained from getSsidList)
     */
    public async getSsidDetail(wlanId: string, ssidId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!wlanId) {
            throw new Error('A wlanId must be provided. Use getWlanGroupList to get available WLAN group IDs.');
        }
        if (!ssidId) {
            throw new Error('An ssidId must be provided. Use getSsidList to get available SSID IDs.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(
            `/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/wlans/${encodeURIComponent(wlanId)}/ssids/${encodeURIComponent(ssidId)}`
        );
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get firewall settings for a site.
     * OperationId: getFirewallSetting
     */
    public async getFirewallSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/firewall`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get VPN settings for a site.
     * OperationId: getVpn
     */
    public async getVpnSettings(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/vpn`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * List site-to-site VPN configurations.
     * OperationId: getSiteToSiteVpnList
     */
    public async listSiteToSiteVpns(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/vpn/site-to-site-vpns`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List client-to-site VPN server configurations.
     * OperationId: getClientToSiteVpnServerList
     */
    public async listClientToSiteVpnServers(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/vpn/client-to-site-vpn-servers`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List NAT port forwarding rules.
     * OperationId: getPortForwardingList
     */
    public async listPortForwardingRules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/nat/port-forwardings`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List one-to-one NAT rules.
     * OperationId: getOneToOneNatList
     */
    public async listOneToOneNatRules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/nat/one-to-one-nat`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List OSG (Gateway) ACL rules.
     * OperationId: getOsgAclList
     */
    public async listOsgAcls(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/acls/osg-acls`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List EAP (Access Point) ACL rules.
     * OperationId: getEapAclList
     */
    public async listEapAcls(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/acls/eap-acls`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List OSW (Switch) ACL rules.
     * OperationId: getOswAclList
     */
    public async listOswAcls(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/acls/osw-acls`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List static routing rules.
     * OperationId: getStaticRoutingList
     */
    public async listStaticRoutes(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/routing/static-routings`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List policy routing rules.
     * OperationId: getPolicyRoutingList
     */
    public async listPolicyRoutes(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/routing/policy-routings`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List RADIUS authentication profiles.
     * OperationId: getRadiusProfileList
     */
    public async listRadiusProfiles(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/profiles/radius`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List group profiles.
     * OperationId: getGroupProfileList
     */
    public async listGroupProfiles(groupType?: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const basePath = `/sites/${encodeURIComponent(resolvedSiteId)}/profiles/groups`;
        const path = this.buildPath(groupType ? `${basePath}/${encodeURIComponent(groupType)}` : basePath);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * Get application control status for a site.
     * OperationId: getApplicationControlStatus
     */
    public async getApplicationControlStatus(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/applicationControl/status`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get bandwidth control settings for a site.
     * OperationId: getBandwidthControl
     */
    public async getBandwidthControl(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/bandwidth-control`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get SSH settings for a site.
     * OperationId: getSshSetting
     */
    public async getSshSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/ssh`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get LED settings for a site.
     * OperationId: getLedSetting
     */
    public async getLedSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/led`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * List time range profiles.
     * OperationId: getTimeRangeProfileList
     */
    public async listTimeRangeProfiles(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/time-range-profiles`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List port schedules.
     * OperationId: getPortScheduleList
     */
    public async listPortSchedules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/port-schedules`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List PoE schedules.
     * OperationId: getPoeScheduleList
     */
    public async listPoeSchedules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/poe-schedules`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * Get gateway URL filter settings for a site.
     * OperationId: getGatewayUrlFilter
     */
    public async getGatewayUrlFilters(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/url-filters/gateway`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get EAP (access point) URL filter settings for a site.
     * OperationId: getEapUrlFilter
     */
    public async getEapUrlFilters(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/url-filters/eap`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * List wireless SSIDs across all WLAN groups.
     * OperationId: getSsidListAll
     */
    public async listAllSsids(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/ssids`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * Get WAN-LAN connectivity status for a site.
     * OperationId: getWanLanStatus
     */
    public async getWanLanStatus(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/wan-lan-status`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * List bandwidth control rules.
     * OperationId: getBandwidthControlRuleList
     */
    public async listBandwidthControlRules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/bandwidth-control/rules`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    // -------------------------------------------------------------------------
    // Phase 1 Read Tools — LAN/Network config (issue #38)
    // -------------------------------------------------------------------------

    /**
     * Get LAN network list (v2).
     * OperationId: getLanNetworkListV2
     */
    public async getLanNetworkListV2(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-networks`, 'v2');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get interface LAN network bindings (v1).
     * OperationId: getInterfaceLanNetwork
     */
    public async getInterfaceLanNetwork(type?: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-networks/interface`);
        const params = type !== undefined ? { type } : undefined;
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, params, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get interface LAN network bindings (v2).
     * OperationId: getInterfaceLanNetworkV2
     */
    public async getInterfaceLanNetworkV2(type?: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lan-networks/interface`, 'v2');
        const params = type !== undefined ? { type } : undefined;
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, params, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get policy routing rules.
     * OperationId: getGridPolicyRouting
     */
    public async getGridPolicyRouting(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/routing/policy-routings`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get available static routing interfaces.
     * OperationId: getStaticRoutingInterfaceList
     */
    public async getStaticRoutingInterfaceList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/routing/static-routings/interfaces`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get 1:1 NAT rules.
     * OperationId: getGridOtoNats
     */
    public async getGridOtoNats(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/nat/one-to-one-nat`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get ALG (Application Layer Gateway) configuration.
     * OperationId: getAlg
     */
    public async getAlg(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/nat/alg`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get UPnP setting.
     * OperationId: getUpnpSetting
     */
    public async getUpnpSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/upnp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get DDNS entries.
     * OperationId: getDdnsGrid
     */
    public async getDdnsGrid(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/service/ddns`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get DHCP reservations.
     * OperationId: getDhcpReservationGrid
     */
    public async getDhcpReservationGrid(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/service/dhcp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IP-MAC binding entries.
     * OperationId: getGridIpMacBinding
     */
    public async getGridIpMacBinding(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/ip-mac-binds`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IP-MAC binding general setting (global toggle).
     * OperationId: getIpMacBindingGeneralSetting
     */
    public async getIpMacBindingGeneralSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/ip-mac-bind`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get SNMP configuration.
     * OperationId: getSnmpSetting
     */
    public async getSnmpSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/service/snmp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get LLDP global setting.
     * OperationId: getLldpSetting
     */
    public async getLldpSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/lldp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get remote logging (syslog) configuration.
     * OperationId: getRemoteLoggingSetting
     */
    public async getRemoteLoggingSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/remote-logging`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get session limit global setting.
     * OperationId: getSessionLimit
     */
    public async getSessionLimit(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/session-limit`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get per-rule session limit rules.
     * OperationId: getGridSessionLimitRule
     */
    public async getGridSessionLimitRule(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/session-limit/rules`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get bandwidth control rules.
     * OperationId: getGridBandwidthCtrlRule
     */
    public async getGridBandwidthCtrlRule(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/bandwidth-control/rules`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get controller access control configuration.
     * OperationId: getAccessControl
     */
    public async getAccessControl(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/access-control`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get DNS cache setting.
     * OperationId: getDnsCacheSetting
     */
    public async getDnsCacheSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/service/dns-cache`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get DNS proxy configuration.
     * OperationId: getDnsProxy
     */
    public async getDnsProxy(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/service/dns-proxy`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IGMP setting.
     * OperationId: getIgmp
     */
    public async getIgmp(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/service/igmp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get WAN load balancing configuration.
     * OperationId: getInternetLoadBalance
     */
    public async getInternetLoadBalance(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/internet/load-balance`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get WAN port settings.
     * OperationId: getWanPortsConfig
     */
    public async getWanPortsConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/internet/ports-config`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get WAN port summary / basic info.
     * OperationId: getInternetBasicPortInfo
     */
    public async getInternetBasicPortInfo(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/internet/basic-info`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get full WAN/Internet configuration.
     * OperationId: getInternet
     */
    public async getInternet(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/internet`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get virtual WAN list.
     * OperationId: getGridVirtualWan
     */
    public async getGridVirtualWan(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/virtual-wans`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get flat SSID list by device type.
     * OperationId: getSsidsBySite
     */
    public async getSsidsBySite(type: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/wireless-network/ssids`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { type }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get RF planning configuration.
     * OperationId: getRadioFrequencyPlanningConfig
     */
    public async getRadioFrequencyPlanningConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/rfPlanning`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get RF planning result.
     * OperationId: getRadioFrequencyPlanningResult
     */
    public async getRadioFrequencyPlanningResult(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/rfPlanning/result`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get band steering configuration.
     * OperationId: getBandSteeringSetting
     */
    public async getBandSteeringSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/band-steering`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get beacon control setting.
     * OperationId: getBeaconControlSetting
     */
    public async getBeaconControlSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/beacon-control`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get channel limit setting.
     * OperationId: getChannelLimitSetting
     */
    public async getChannelLimitSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/channel-limit`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get mesh configuration.
     * OperationId: getMeshSetting
     */
    public async getMeshSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/mesh`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get client roaming configuration.
     * OperationId: getRoamingSetting
     */
    public async getRoamingSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/roaming`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get OUI-based device profile list (paginated).
     * OperationId: getOuiProfileList
     */
    public async getOuiProfileList(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/oui-profiles`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get MAC authentication global setting.
     * OperationId: getMacAuthSetting
     */
    public async getMacAuthSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/mac-auth`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get per-SSID MAC authentication settings.
     * OperationId: getMacAuthSsids
     */
    public async getMacAuthSsids(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/mac-auth/ssids`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get MAC filtering global setting.
     * OperationId: getMacFilteringGeneralSetting
     */
    public async getMacFilteringGeneralSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/mac-filter`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get MAC allow-list entries (paginated).
     * OperationId: getGridAllowMacFiltering
     */
    public async getGridAllowMacFiltering(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/mac-filters/allow`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get MAC deny-list entries (paginated).
     * OperationId: getGridDenyMacFiltering
     */
    public async getGridDenyMacFiltering(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/mac-filters/deny`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get 802.1X switch setting.
     * OperationId: getSwitchDot1xSetting
     */
    public async getSwitchDot1xSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dot1x`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get 802.1X EAP setting.
     * OperationId: getEapDot1xSetting
     */
    public async getEapDot1xSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dot1x/eap`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    // Firewall / ACL / IPS / URL-filter tools (issue #37)

    /**
     * Get ACL config type setting (L2/L3 mode).
     * OperationId: getAclConfigTypeSetting
     */
    public async getAclConfigTypeSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/acls/osg-config-mode`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get custom gateway ACL rules list (paginated).
     * OperationId: getOsgCustomAclList
     */
    public async getOsgCustomAclList(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/acls/osg-custom-acls`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get switch ACL list (paginated).
     * OperationId: getOswAclList
     */
    public async getOswAclList(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/acls/osw-acls`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IPS global configuration.
     * OperationId: getIpsConfig
     */
    public async getIpsConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/network-security/ips`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IPS signature list (paginated).
     * OperationId: getGridSignature
     */
    public async getGridSignature(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/network-security/ips/signature`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IPS allow list (paginated, optional searchKey).
     * OperationId: getGridAllowList
     */
    public async getGridAllowList(
        page: number,
        pageSize: number,
        searchKey?: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/network-security/ips/grid/allow-list`);
        const params: Record<string, unknown> = { page, pageSize };
        if (searchKey !== undefined) params.searchKey = searchKey;
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, params, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IPS block list (paginated, optional searchKey).
     * OperationId: getGridBlockList
     */
    public async getGridBlockList(
        page: number,
        pageSize: number,
        searchKey?: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/network-security/ips/grid/block-list`);
        const params: Record<string, unknown> = { page, pageSize };
        if (searchKey !== undefined) params.searchKey = searchKey;
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, params, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get DDoS/attack defense configuration.
     * OperationId: getAttackDefenseSetting
     */
    public async getAttackDefenseSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/attack-defense`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get URL filter global setting.
     * OperationId: getUrlFilterGeneral
     */
    public async getUrlFilterGeneral(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/url-filters/globalUrlFilter`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get URL filter gateway rules (paginated).
     * OperationId: getGridGatewayRule
     */
    public async getGridGatewayRule(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/url-filters/gateway`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get URL filter AP rules (paginated).
     * OperationId: getGridEapRule
     */
    public async getGridEapRule(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/url-filters/eap`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
