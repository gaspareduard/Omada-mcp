import type { CustomHeaders, OmadaApiResponse } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

/**
 * Monitor / dashboard operations for the Omada API.
 * Covers site dashboard statistics and summaries.
 */
export class MonitorOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * Get WiFi summary for a site dashboard.
     * OperationId: getWifiSummary
     */
    public async getDashboardWifiSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/wifi-summary`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get switch summary for a site dashboard.
     * OperationId: getSwitchSummary
     */
    public async getDashboardSwitchSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/switch-summary`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get traffic distribution statistics for a site dashboard.
     * OperationId: getTrafficDistribution
     */
    public async getTrafficDistribution(siteId?: string, start?: number, end?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/traffic-distribution`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { start, end }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get wireless retry rate and dropped packet rate over a time range.
     * OperationId: getRetryAndDroppedRate
     */
    public async getRetryAndDroppedRate(siteId?: string, start?: number, end?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/retry-dropped-rate`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { start, end }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get traffic activity time-series data for a site dashboard.
     * OperationId: getTrafficActivities
     */
    public async getDashboardTrafficActivities(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/traffic-activities`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get PoE usage statistics for a site dashboard.
     * OperationId: getPoeUsage
     */
    public async getDashboardPoEUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/poe-usage`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get top devices by CPU usage for a site dashboard.
     * OperationId: getTopDeviceCpuUsage
     */
    public async getDashboardTopCpuUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/top-device-cpu-usage`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get top devices by memory usage for a site dashboard.
     * OperationId: getTopDeviceMemoryUsage
     */
    public async getDashboardTopMemoryUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/top-device-memory-usage`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get most active switches for a site dashboard.
     * OperationId: getMostActiveSwitches
     */
    public async getDashboardMostActiveSwitches(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/most-active-switches`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get most active EAPs (access points) for a site dashboard.
     * OperationId: getMostActiveEaps
     */
    public async getDashboardMostActiveEaps(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/most-active-eaps`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get site overview diagram data for a site dashboard.
     * OperationId: getOverviewDiagram
     */
    public async getDashboardOverview(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/overview-diagram`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get channel distribution and utilization across all APs.
     * OperationId: getChannels
     */
    public async getChannels(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/channels`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get per-WAN ISP link load over a time range.
     * OperationId: getIspLoad
     */
    public async getIspLoad(siteId?: string, start?: number, end?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/isp-load`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { start, end }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get top RF interference sources detected by APs.
     * OperationId: getInterference
     */
    public async getInterference(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/top-interference`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get VPN tunnel statistics by type.
     * OperationId: getGridDashboardTunnelStats
     */
    public async getGridDashboardTunnelStats(siteId?: string, type?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/vpn-tunnel-stats`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { type }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IPsec tunnel statistics.
     * OperationId: getGridDashboardIpsecTunnelStats
     */
    public async getGridDashboardIpsecTunnelStats(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/lpset-tunnel-stats`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get OpenVPN tunnel statistics by type.
     * OperationId: getGridDashboardOpenVpnTunnelStats
     */
    public async getGridDashboardOpenVpnTunnelStats(siteId?: string, type?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/open-vpn-tunnel-stats`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { type }, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
