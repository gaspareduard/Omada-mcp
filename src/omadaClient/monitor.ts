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
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/wifi-summary`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get switch summary for a site dashboard.
     * OperationId: getSwitchSummary
     */
    public async getDashboardSwitchSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/switch-summary`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get traffic distribution statistics for a site dashboard.
     * OperationId: getTrafficDistribution
     */
    public async getDashboardTrafficDistribution(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/traffic-distribution`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get traffic activity time-series data for a site dashboard.
     * OperationId: getTrafficActivities
     */
    public async getDashboardTrafficActivities(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/traffic-activities`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get PoE usage statistics for a site dashboard.
     * OperationId: getPoeUsage
     */
    public async getDashboardPoEUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/poe-usage`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get top devices by CPU usage for a site dashboard.
     * OperationId: getTopDeviceCpuUsage
     */
    public async getDashboardTopCpuUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/top-device-cpu-usage`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get top devices by memory usage for a site dashboard.
     * OperationId: getTopDeviceMemoryUsage
     */
    public async getDashboardTopMemoryUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/top-device-memory-usage`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get most active switches for a site dashboard.
     * OperationId: getMostActiveSwitches
     */
    public async getDashboardMostActiveSwitches(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/most-active-switches`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get most active EAPs (access points) for a site dashboard.
     * OperationId: getMostActiveEaps
     */
    public async getDashboardMostActiveEaps(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/most-active-eaps`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get site overview diagram data for a site dashboard.
     * OperationId: getOverviewDiagram
     */
    public async getDashboardOverview(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/overview-diagram`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get channel usage statistics for a site dashboard.
     * OperationId: getChannels
     */
    public async getDashboardChannels(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/channels`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get ISP load balance statistics for a site dashboard.
     * OperationId: getIspLoad
     */
    public async getDashboardIspLoad(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/isp-load`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
