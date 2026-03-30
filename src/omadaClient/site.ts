import type { CustomHeaders, OmadaApiResponse, OmadaSiteSummary } from '../types/index.js';

import type { RequestHandler } from './request.js';

/**
 * Site-related operations for the Omada API.
 */
export class SiteOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly buildPath: (path: string) => string,
        private readonly defaultSiteId?: string
    ) {}

    /**
     * List all sites accessible to the authenticated user.
     */
    public async listSites(customHeaders?: CustomHeaders): Promise<OmadaSiteSummary[]> {
        return await this.request.fetchPaginated<OmadaSiteSummary>(this.buildPath('/sites'), {}, customHeaders);
    }

    /**
     * Resolve a site ID from the parameter or default configuration.
     * @throws {Error} If no site ID is available
     */
    public resolveSiteId(siteId?: string): string {
        if (siteId) {
            return siteId;
        }

        if (this.defaultSiteId) {
            return this.defaultSiteId;
        }

        throw new Error('A site id must be provided either in the environment or as a parameter.');
    }

    /**
     * Get site detail by site ID.
     * OperationId: getSiteEntity
     */
    public async getSiteDetail(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site URL.
     * OperationId: getSiteUrlByOpenApi
     */
    public async getSiteUrl(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/url`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site NTP server status.
     * OperationId: getNtpServerStatus
     */
    public async getSiteNtpStatus(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/ntp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site specification.
     * OperationId: getSiteSpecification
     */
    public async getSiteSpecification(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/specification`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site remember device setting.
     * OperationId: getSiteRememberSettingByOpenApi
     */
    public async getSiteRememberSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/remember-device`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site device account setting.
     * OperationId: getSiteDeviceAccountSetting
     */
    public async getSiteDeviceAccount(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/device-account`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site capacity.
     * OperationId: getSiteSettingCap
     */
    public async getSiteCapacity(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/capacity`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site template list.
     * OperationId: getSiteTemplateList
     */
    public async getSiteTemplateList(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/sitetemplates');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site template detail by template ID.
     * OperationId: getSiteTemplateEntity
     */
    public async getSiteTemplateDetail(siteTemplateId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath(`/sitetemplates/${encodeURIComponent(siteTemplateId)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site template configuration.
     * OperationId: getSiteTemplateConfiguration
     */
    public async getSiteTemplateConfig(siteTemplateId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath(`/sitetemplates/${encodeURIComponent(siteTemplateId)}/setting/configuration`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
