import type { CustomHeaders, OmadaApiResponse } from '../types/index.js';

import type { RequestHandler } from './request.js';
import * as schemas from './requestSchemas.js';
import type { Input } from './siteConfig.js';

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

    /**
     * Create a controller role.
     * OperationId: createNewRole
     */
    public async createRole(payload: Input<typeof schemas.modifyControllerRoleVO01Schema>, customHeaders?: CustomHeaders): Promise<unknown> {
        const response = await this.request.post<OmadaApiResponse<unknown>>(
            this.buildPath('/roles'),
            schemas.modifyControllerRoleVO01Schema.parse(payload),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Modify a controller role.
     * OperationId: modifyRole
     */
    public async updateRole(
        roleId: string,
        payload: Input<typeof schemas.modifyControllerRoleVO01Schema>,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const response = await this.request.put<OmadaApiResponse<unknown>>(
            this.buildPath(`/roles/${encodeURIComponent(roleId)}`),
            schemas.modifyControllerRoleVO01Schema.parse(payload),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Delete a controller role.
     * OperationId: deleteRole
     */
    public async deleteRole(roleId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const response = await this.request.delete<OmadaApiResponse<unknown>>(this.buildPath(`/roles/${encodeURIComponent(roleId)}`), customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Turn the controller's two-factor authentication on or off.
     * OperationId: modifyGlobalMFAStatus
     */
    public async setMfaStatus(payload: Input<typeof schemas.mFAConfigOpenApiVO01Schema>, customHeaders?: CustomHeaders): Promise<unknown> {
        const response = await this.request.post<OmadaApiResponse<unknown>>(
            this.buildPath('/mfa/status'),
            schemas.mFAConfigOpenApiVO01Schema.parse(payload),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * List every SAML identity provider.
     * OperationId: getIdpMetadataList
     */
    public async listSamlIdps(customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.request.fetchPaginated(this.buildPath('/sso/saml-idps'), {}, customHeaders);
    }

    /**
     * Create a SAML identity provider.
     * OperationId: createIdpMetadata
     */
    public async createSamlIdp(payload: Input<typeof schemas.idpMetadataOpenApiVO01Schema>, customHeaders?: CustomHeaders): Promise<unknown> {
        const response = await this.request.post<OmadaApiResponse<unknown>>(
            this.buildPath('/sso/saml-idps'),
            schemas.idpMetadataOpenApiVO01Schema.parse(payload),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Modify a SAML identity provider.
     * OperationId: modifyIdpMetadata
     */
    public async updateSamlIdp(
        idpId: string,
        payload: Input<typeof schemas.idpMetadataOpenApiVO01Schema>,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const response = await this.request.put<OmadaApiResponse<unknown>>(
            this.buildPath(`/sso/saml-idps/${encodeURIComponent(idpId)}`),
            schemas.idpMetadataOpenApiVO01Schema.parse(payload),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Delete a SAML identity provider.
     * OperationId: deleteIdpMetadata
     */
    public async deleteSamlIdp(idpId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const response = await this.request.delete<OmadaApiResponse<unknown>>(
            this.buildPath(`/sso/saml-idps/${encodeURIComponent(idpId)}`),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * List every SSO external user group.
     * OperationId: getExternalUserGroupList
     */
    public async listExternalUserGroups(customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.request.fetchPaginated(this.buildPath('/sso/external-user-groups'), {}, customHeaders);
    }

    /**
     * Create an SSO external user group.
     * OperationId: createExternalUserGroup
     */
    public async createExternalUserGroup(
        payload: Input<typeof schemas.externalUserGroupOpenApiVO01Schema>,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const response = await this.request.post<OmadaApiResponse<unknown>>(
            this.buildPath('/sso/external-user-groups'),
            schemas.externalUserGroupOpenApiVO01Schema.parse(payload),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Modify an SSO external user group.
     * OperationId: modifyExternalUserGroup
     */
    public async updateExternalUserGroup(
        groupId: string,
        payload: Input<typeof schemas.externalUserGroupOpenApiVO01Schema>,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const response = await this.request.put<OmadaApiResponse<unknown>>(
            this.buildPath(`/sso/external-user-groups/${encodeURIComponent(groupId)}`),
            schemas.externalUserGroupOpenApiVO01Schema.parse(payload),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Delete an SSO external user group.
     * OperationId: deleteExternalUserGroup
     */
    public async deleteExternalUserGroup(groupId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const response = await this.request.delete<OmadaApiResponse<unknown>>(
            this.buildPath(`/sso/external-user-groups/${encodeURIComponent(groupId)}`),
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * List every user that signed in through SSO.
     * OperationId: getExternalUserList
     */
    public async listExternalUsers(customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.request.fetchPaginated(this.buildPath('/sso/external-users'), {}, customHeaders);
    }
}
