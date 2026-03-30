import type { CustomHeaders, OmadaApiResponse } from '../types/index.js';

import type { RequestHandler } from './request.js';

/**
 * Controller-level operations for the Omada API.
 * Covers global system settings, retention, ports, certificates, and related controller settings.
 */
export class ControllerOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * Get data retention settings.
     * OperationId: getDataRetention
     */
    public async getDataRetention(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/retention');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get controller port setting.
     * OperationId: getControllerPort
     */
    public async getControllerPort(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/system/setting/controller-port');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get portal port setting.
     * OperationId: getPortalPort
     */
    public async getPortalPort(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/system/setting/portal-port');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get certificate configuration.
     * OperationId: getCertificate
     */
    public async getCertificate(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/system/setting/certificate');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get experience improvement setting.
     * OperationId: getExpImprove
     */
    public async getExperienceImprovement(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/global/controller/setting/exp-improve');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global dashboard overview (without client data).
     * OperationId: getGernalSettings_1
     */
    public async getGlobalDashboardOverview(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/dashboard/overview-without-client');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get client history data enable setting.
     * OperationId: getClientHistoryDataEnable
     */
    public async getClientHistoryDataEnable(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/controller/client/history-enable');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
