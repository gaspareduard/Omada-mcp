import type { CustomHeaders, PaginatedResult } from '../types/index.js';
import type { GetThreatListOptions, ThreatInfo } from '../types/threatInfo.js';
import type { RequestHandler } from './request.js';

/**
 * Security-related operations for the Omada API.
 * Handles threat management and security features.
 */
export class SecurityOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * Get the global view threat management list.
     * operationId: getGlobalThreatList
     *
     * @param options - Threat list query options
     * @returns Paginated list of threat information
     */
    async getThreatList(options: GetThreatListOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<ThreatInfo>> {
        const params: Record<string, string | number | boolean> = {
            archived: options.archived,
            page: options.page,
            pageSize: options.pageSize,
            'filters.startTime': options.startTime,
            'filters.endTime': options.endTime,
        };

        if (options.siteList) {
            params.siteList = options.siteList;
        }

        if (options.severity !== undefined) {
            params['filters.severity'] = options.severity;
        }

        if (options.sortTime) {
            params['sorts.time'] = options.sortTime;
        }

        if (options.searchKey) {
            params.searchKey = options.searchKey;
        }

        const path = this.buildPath('/security/threat-management');

        return await this.request.request<PaginatedResult<ThreatInfo>>(
            {
                method: 'GET',
                url: path,
                params,
            },
            true,
            customHeaders
        );
    }

    /**
     * Get top threats from the global view threat management.
     * OperationId: getTopThreatList
     */
    public async getTopThreats(customHeaders?: CustomHeaders): Promise<unknown[]> {
        const path = this.buildPath('/security/threat-management/top');
        const response = await this.request.get<{ errorCode: number; result: unknown[] }>(path, undefined, customHeaders);
        return response.result ?? [];
    }

    /**
     * Get threat severity summary from the global view.
     * OperationId: getThreatSeverity
     */
    public async getThreatSeverity(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/security/threat-management/severity');
        const response = await this.request.get<{ errorCode: number; result: unknown }>(path, undefined, customHeaders);
        return response.result;
    }
}
