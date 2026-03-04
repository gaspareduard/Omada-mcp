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
}
