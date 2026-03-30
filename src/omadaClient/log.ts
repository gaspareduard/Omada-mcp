import type { CustomHeaders, OmadaApiResponse, PaginatedResult } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

export interface LogQueryOptions {
    page: number;
    pageSize: number;
    startTime?: number;
    endTime?: number;
    searchKey?: string;
}

/**
 * Log operations for the Omada API.
 * Covers site events, alerts, and audit logs.
 */
export class LogOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string, version?: string) => string
    ) {}

    /**
     * List site event logs.
     * OperationId: getSiteEvents
     */
    public async listSiteEvents(options: LogQueryOptions, siteId?: string, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/logs/events`);

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
     * List site alert logs.
     * OperationId: getSiteAlerts
     */
    public async listSiteAlerts(options: LogQueryOptions, siteId?: string, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/logs/alerts`);

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
     * List site audit logs.
     * OperationId: getSiteAuditLogs
     */
    public async listSiteAuditLogs(options: LogQueryOptions, siteId?: string, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/audit-logs`);

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
     * List global event logs (all sites).
     * OperationId: getEvents
     */
    public async listGlobalEvents(options: LogQueryOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        const path = this.buildPath('/logs/events');

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
     * List global alert logs (all sites).
     * OperationId: getAlerts
     */
    public async listGlobalAlerts(options: LogQueryOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        const path = this.buildPath('/logs/alerts');

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
     * List global audit logs (all sites).
     * OperationId: getAuditLogs
     */
    public async listGlobalAuditLogs(options: LogQueryOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        const path = this.buildPath('/audit-logs');

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

    // Logs, Events & Alerts tools (issue #42)

    /**
     * Get site log notification settings (v1).
     * OperationId: getLogSettingForSite
     */
    public async getLogSettingForSite(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/site/log-notification`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site log notification settings (v2).
     * OperationId: getLogSettingForSiteV2
     */
    public async getLogSettingForSiteV2(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/site/log-notification`, 'v2');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site audit notification settings.
     * OperationId: getAuditLogSettingForSite
     */
    public async getAuditLogSettingForSite(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/site/audit-notification`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global log notification settings (v1).
     * OperationId: getLogSettingForGlobal
     */
    public async getLogSettingForGlobal(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/log-notification');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global log notification settings (v2).
     * OperationId: getLogSettingForGlobalV2
     */
    public async getLogSettingForGlobalV2(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/log-notification', 'v2');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global audit notification settings.
     * OperationId: getAuditLogSettingForGlobal
     */
    public async getAuditLogSettingForGlobal(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/audit-notification');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global audit logs (paginated, optional filters).
     * OperationId: getAuditLogsForGlobal
     */
    public async getAuditLogsForGlobal(
        page: number,
        pageSize: number,
        options?: {
            sortTime?: string;
            filterResult?: number;
            filterLevel?: string;
            filterAuditTypes?: string;
            filterTimes?: string;
            searchKey?: string;
        },
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const path = this.buildPath('/audit-logs');
        const params: Record<string, unknown> = { page, pageSize };
        if (options?.sortTime !== undefined) params['sorts.time'] = options.sortTime;
        if (options?.filterResult !== undefined) params['filters.result'] = options.filterResult;
        if (options?.filterLevel !== undefined) params['filters.level'] = options.filterLevel;
        if (options?.filterAuditTypes !== undefined) params['filters.auditTypes'] = options.filterAuditTypes;
        if (options?.filterTimes !== undefined) params['filters.times'] = options.filterTimes;
        if (options?.searchKey !== undefined) params.searchKey = options.searchKey;
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, params, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
