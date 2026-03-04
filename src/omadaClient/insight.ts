import type { CustomHeaders, OmadaApiResponse, PaginatedResult } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

export interface SiteThreatListOptions {
    page: number;
    pageSize: number;
    startTime?: number;
    endTime?: number;
    searchKey?: string;
}

/**
 * Insight operations for the Omada API.
 * Covers site-level threat management, WIDS, rogue APs, and VPN stats.
 */
export class InsightOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * List site-level threat management events.
     * OperationId: getSiteThreatManagementList
     */
    public async listSiteThreatManagement(
        options: SiteThreatListOptions,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/ips/grid/threat-management`);

        const params: Record<string, unknown> = {
            page: options.page,
            pageSize: options.pageSize,
        };

        if (options.startTime !== undefined) {
            params['filters.startTime'] = options.startTime;
        }
        if (options.endTime !== undefined) {
            params['filters.endTime'] = options.endTime;
        }
        if (options.searchKey) {
            params.searchKey = options.searchKey;
        }

        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, params, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get WIDS (Wireless Intrusion Detection System) information for a site.
     * OperationId: getWids
     */
    public async getWids(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/wids`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get WIDS blacklist for a site.
     * OperationId: getWidsBlacklist
     */
    public async getWidsBlacklist(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/wids/blacklist`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * Get rogue APs detected in a site.
     * OperationId: getRogueAps
     */
    public async getRogueAps(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/rogueaps`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * Get VPN tunnel statistics for a site.
     * OperationId: getVpnTunnelStats
     */
    public async getVpnTunnelStats(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/vpn/stats/tunnel`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get IPsec VPN statistics for a site.
     * OperationId: getIpsecVpnStats
     */
    public async getIpsecVpnStats(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/vpn/stats/ipsec`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get insight client list for a site.
     * OperationId: getInsightClients
     */
    public async listInsightClients(
        page: number,
        pageSize: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/clients`);
        const response = await this.request.get<OmadaApiResponse<PaginatedResult<unknown>>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get routing table for a site.
     * OperationId: getRoutingTable
     */
    public async getRoutingTable(type: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/routing/${encodeURIComponent(type)}`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }
}
