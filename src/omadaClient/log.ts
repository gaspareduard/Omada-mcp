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
        private readonly buildPath: (path: string) => string
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
}
