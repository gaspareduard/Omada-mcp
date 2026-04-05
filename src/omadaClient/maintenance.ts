import type { CustomHeaders, OmadaApiResponse } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

export interface FileServerConfig {
    protocol: string;
    hostname: string;
    port: number;
    username?: string;
    password?: string;
}

export interface SiteRestoreInfo {
    fileName: string;
    siteId: string;
}

export interface SiteFileRestoreInfo {
    filePath: string;
    siteId: string;
}

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
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/backup/result`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get list of site backup files.
     * OperationId: getSelfServerSiteFileList
     */
    public async getSiteBackupFileList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/maintenance/backup/files`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Export site Rogue AP scan results.
     * OperationId: getSitesRogueAp
     */
    public async getRogueApExport(
        siteId?: string,
        format: '0' | '1' = '0',
        page = 1,
        pageSize = 10,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/rogue-ap/export/${encodeURIComponent(format)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Backup controller config to self/cloud server.
     * OperationId: backupSelfServer
     */
    public async backupController(retainUser: boolean, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/maintenance/backup/self-server');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { retainUser }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Backup controller config to file server.
     * OperationId: backupFileServer
     */
    public async backupControllerToFileServer(
        serverConfig: FileServerConfig,
        filePath: string,
        retainUser: boolean,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const path = this.buildPath('/maintenance/backup/file-server');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { serverConfig, filePath, retainUser }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Restore controller config from self/cloud server.
     * OperationId: restoreSelfServer
     */
    public async restoreController(fileName: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/maintenance/restore/self-server');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { fileName }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Restore controller config from file server.
     * OperationId: restoreFileServer
     */
    public async restoreControllerFromFileServer(
        serverConfig: FileServerConfig,
        filePath: string,
        skipDevice: boolean,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const path = this.buildPath('/maintenance/restore/file-server');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { serverConfig, filePath, skipDevice }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Backup multiple sites config to self server.
     * OperationId: backupSitesSelfServer
     */
    public async backupSites(siteIds: string[], customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/sites/maintenance/multi-backup/self-server');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { siteIds }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Backup multiple sites config to file server.
     * OperationId: backupSitesFileServer
     */
    public async backupSitesToFileServer(
        serverConfig: FileServerConfig,
        filePath: string,
        siteIds: string[],
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const path = this.buildPath('/sites/maintenance/multi-backup/file-server');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { serverConfig, filePath, siteIds }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Restore multiple sites config from self server.
     * OperationId: restoreSitesSelfServer
     */
    public async restoreSites(siteRestoreInfos: SiteRestoreInfo[], customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/sites/maintenance/multi-restore/self-server');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { siteRestoreInfos }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Restore multiple sites config from file server.
     * OperationId: restoreSitesFileServer
     */
    public async restoreSitesFromFileServer(
        serverConfig: FileServerConfig,
        siteInfos: SiteFileRestoreInfo[],
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const path = this.buildPath('/sites/maintenance/multi-restore/file-server');
        const response = await this.request.post<OmadaApiResponse<unknown>>(path, { serverConfig, siteInfos }, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
