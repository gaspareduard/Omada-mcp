import type { CustomHeaders, OmadaApiResponse } from '../types/index.js';

import type { RequestHandler } from './request.js';

/**
 * Account-related operations for the Omada API.
 * Covers users, roles, cloud access, and MFA settings.
 */
export class AccountOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * Get all cloud users (excluding root).
     * OperationId: getAllCloudUsersExcludeRoot
     */
    public async getAllCloudUsers(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/users/cloud');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get all local users (excluding root).
     * OperationId: getAllLocalUsersExcludeRoot
     */
    public async getAllLocalUsers(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/users/local');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get all roles.
     * OperationId: getAllRoles
     */
    public async getAllRoles(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/roles');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get role detail by role ID.
     * OperationId: getRole
     */
    public async getRoleDetail(roleId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath(`/roles/${encodeURIComponent(roleId)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get available roles for assignment.
     * OperationId: getAvailableRole
     */
    public async getAvailableRoles(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/roles/available');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get all users (app grid view).
     * OperationId: getAppGridUsers
     */
    public async getAllUsersApp(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/all-users');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get cloud access status.
     * OperationId: getCloudAccessStatus
     */
    public async getCloudAccessStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/cloud/status');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get cloud user info.
     * OperationId: getCloudUserInfo
     */
    public async getCloudUserInfo(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/cloud/user');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get global MFA status.
     * OperationId: getGlobalMFAStatus
     */
    public async getMfaStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/mfa/status');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get remote binding status.
     * OperationId: getRemoteBindingStatus
     */
    public async getRemoteBindingStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/cloud/remote/bind/status');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
