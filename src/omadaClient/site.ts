import type { CustomHeaders, OmadaApiResponse, OmadaSiteSummary } from '../types/index.js';
import { logger } from '../utils/logger.js';

import type { RequestHandler } from './request.js';

/**
 * Site-related operations for the Omada API.
 */
export class SiteOperations {
    private discoveryPromise: Promise<string> | null = null;
    private discoveredSiteId: string | null = null;

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
     * Resolve a site ID from the parameter, default configuration, or auto-discovery.
     * When no site ID is configured, automatically discovers available sites:
     * - 1 site found: auto-selects it and caches for future calls
     * - 0 sites found: throws with a clear error
     * - 2+ sites found: throws listing all sites so the user can choose
     * @throws {Error} If no site ID can be resolved
     */
    public resolveSiteId(siteId?: string): Promise<string> {
        if (siteId) {
            return Promise.resolve(siteId);
        }

        if (this.defaultSiteId) {
            return Promise.resolve(this.defaultSiteId);
        }

        if (this.discoveredSiteId) {
            return Promise.resolve(this.discoveredSiteId);
        }

        if (!this.discoveryPromise) {
            this.discoveryPromise = this.discoverSiteId();
        }
        return this.discoveryPromise;
    }

    /**
     * Discover the site ID by listing all available sites.
     * @throws {Error} If no sites or multiple sites are found
     */
    private async discoverSiteId(): Promise<string> {
        const sites = await this.listSites();

        if (sites.length === 0) {
            throw new Error('No sites found on this Omada controller. Please verify your controller setup.');
        }

        if (sites.length === 1) {
            this.discoveredSiteId = sites[0].siteId;
            logger.info('Auto-discovered site', { siteId: this.discoveredSiteId, siteName: sites[0].name });
            return this.discoveredSiteId;
        }

        const siteList = sites.map((s: OmadaSiteSummary) => `  - "${s.name}" (siteId: ${s.siteId})`).join('\n');
        throw new Error(`Multiple sites found on this controller. Set OMADA_SITE_ID in your configuration to one of:\n${siteList}`);
    }

    /**
     * Get site detail by site ID.
     * OperationId: getSiteEntity
     */
    public async getSiteDetail(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site URL.
     * OperationId: getSiteUrlByOpenApi
     */
    public async getSiteUrl(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/url`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site NTP server status.
     * OperationId: getNtpServerStatus
     */
    public async getSiteNtpStatus(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/setting/ntp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site specification.
     * OperationId: getSiteSpecification
     */
    public async getSiteSpecification(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/specification`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site remember device setting.
     * OperationId: getSiteRememberSettingByOpenApi
     */
    public async getSiteRememberSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/remember-device`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site device account setting.
     * OperationId: getSiteDeviceAccountSetting
     */
    public async getSiteDeviceAccount(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/device-account`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site capacity.
     * OperationId: getSiteSettingCap
     */
    public async getSiteCapacity(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.resolveSiteId(siteId);
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
