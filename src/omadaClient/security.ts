import type { CustomHeaders, OmadaApiResponse, PaginatedResult } from '../types/index.js';
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
    public async getThreatSeverity(startTime: number, endTime: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/security/threat-management/severity');
        const response = await this.request.get<{ errorCode: number; result: unknown }>(path, { startTime, endTime }, customHeaders);
        return response.result;
    }

    // Global Controller settings (issue #41)

    /**
     * Get controller status/health.
     * OperationId: getControllerStatus
     */
    public async getControllerStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/system/setting/controller-status');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global general settings.
     * OperationId: getGeneralSettings
     */
    public async getGeneralSettings(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/global/controller/setting/general');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get data retention setting.
     * OperationId: getRetention
     */
    public async getRetention(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/controller/setting/retention');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get client inactivity timeout.
     * OperationId: getClientActiveTimeout
     */
    public async getClientActiveTimeout(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/controller/setting/active-timeout');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global syslog/remote logging config.
     * OperationId: getRemoteLogging
     */
    public async getRemoteLogging(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/global/controller/setting/syslog');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global RADIUS server config.
     * OperationId: getRadiusServer
     */
    public async getRadiusServer(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/global/controller/setting/network/radius-server');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get controller logging config.
     * OperationId: getLogging
     */
    public async getLogging(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/system/setting/logging');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get UI interface settings.
     * OperationId: getUiInterface
     */
    public async getUiInterface(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/controller/setting/ui-interface');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get device access management settings.
     * OperationId: getDeviceAccessManagement
     */
    public async getDeviceAccessManagement(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/controller/setting/services/device-access');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get webhook notification settings.
     * OperationId: getWebhookForGlobal
     */
    public async getWebhookForGlobal(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/webhook/settings');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get webhook dispatch logs (paginated, required filters).
     * OperationId: getWebhookLogsForGlobal
     * @param timeStart - Start of time range in epoch milliseconds (e.g. 1679297710438)
     * @param timeEnd - End of time range in epoch milliseconds (e.g. 1681889710438)
     */
    public async getWebhookLogsForGlobal(
        page: number,
        pageSize: number,
        webhookId: string,
        timeStart: number,
        timeEnd: number,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const path = this.buildPath('/webhook/settings/dispatch-logs');
        const response = await this.request.get<OmadaApiResponse<unknown>>(
            path,
            { page, pageSize, 'filters.webhookId': webhookId, 'filters.timeStart': timeStart, 'filters.timeEnd': timeEnd },
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Get mail server status.
     * OperationId: getMailServerStatus
     */
    public async getMailServerStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/mail/status');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
