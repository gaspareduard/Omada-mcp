import type { CustomHeaders, OmadaApiResponse } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

/**
 * Maintenance operations for the Omada API.
 * Covers backup and restore status and file listing.
 */
export class MaintenanceOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * Get list of controller backup files.
     * OperationId: getSelfServerFileList
     */
    public async getBackupFileList(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/maintenance/backup/files');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get controller backup result.
     * OperationId: getBackupResult
     */
    public async getBackupResult(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/maintenance/backup/result');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get controller restore result.
     * OperationId: getRestoreResult
     */
    public async getRestoreResult(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/maintenance/restore/result');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get site backup result.
     * OperationId: getSiteBackupResult
     */
    public async getSiteBackupResult(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/backup/result`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get list of site backup files.
     * OperationId: getSelfServerSiteFileList
     */
    public async getSiteBackupFileList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/maintenance/backup/files`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
