import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountOperations } from '../../src/omadaClient/account.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { OmadaApiResponse } from '../../src/types/index.js';

describe('AccountOperations', () => {
    let accountOps: AccountOperations;
    let mockRequest: RequestHandler;
    let mockBuildPath: (path: string) => string;

    beforeEach(() => {
        mockRequest = {
            get: vi.fn(),
            ensureSuccess: vi.fn((response: OmadaApiResponse<unknown>) => {
                if (response.errorCode === 0) return response.result;
                throw new Error(response.msg ?? 'API Error');
            }),
        } as unknown as RequestHandler;
        mockBuildPath = vi.fn((path: string) => `/openapi/v1/test-omadac${path}`);
        accountOps = new AccountOperations(mockRequest, mockBuildPath);
    });

    describe('getAllCloudUsers', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { users: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getAllCloudUsers();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/users/cloud', undefined, undefined);
            expect(result).toEqual({ users: [] });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getAllCloudUsers({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });

        it('should throw on API error', async () => {
            const mockResponse = { errorCode: 1, msg: 'Forbidden' };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockImplementation(() => {
                throw new Error('Forbidden');
            });
            await expect(accountOps.getAllCloudUsers()).rejects.toThrow('Forbidden');
        });
    });

    describe('getAllLocalUsers', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { users: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getAllLocalUsers();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/users/local', undefined, undefined);
            expect(result).toEqual({ users: [] });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getAllLocalUsers({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getRoleDetail', () => {
        it('should call correct endpoint with roleId', async () => {
            const mockResponse = { errorCode: 0, result: { id: 'role-1', name: 'Admin' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getRoleDetail('role-1');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/roles/role-1', undefined, undefined);
            expect(result).toEqual({ id: 'role-1', name: 'Admin' });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getRoleDetail('role-1', { 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getAvailableRoles', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { roles: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getAvailableRoles();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/roles/available', undefined, undefined);
            expect(result).toEqual({ roles: [] });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getAvailableRoles({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getAllUsersApp', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { users: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getAllUsersApp();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/all-users', undefined, undefined);
            expect(result).toEqual({ users: [] });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getAllUsersApp({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getCloudAccessStatus', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { connected: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getCloudAccessStatus();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/cloud/status', undefined, undefined);
            expect(result).toEqual({ connected: true });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getCloudAccessStatus({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getCloudUserInfo', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { email: 'user@example.com' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getCloudUserInfo();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/cloud/user', undefined, undefined);
            expect(result).toEqual({ email: 'user@example.com' });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getCloudUserInfo({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getMfaStatus', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { enabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getMfaStatus();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/mfa/status', undefined, undefined);
            expect(result).toEqual({ enabled: true });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getMfaStatus({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getRemoteBindingStatus', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { bound: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await accountOps.getRemoteBindingStatus();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/cloud/remote/bind/status', undefined, undefined);
            expect(result).toEqual({ bound: true });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await accountOps.getRemoteBindingStatus({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });
});

describe('AccountOperations writes and SSO collections', () => {
    const ok = { errorCode: 0, msg: 'Success.', result: { id: 'x' } };
    let request: Record<string, ReturnType<typeof vi.fn>>;
    let ops: AccountOperations;
    const role = { name: 'mcp-role', privilege: { devices: 1 } };
    const idp = { name: 'idp', entityId: 'https://idp.example.com/metadata', loginUrl: 'https://idp.example.com/sso', x509Certificate: 'TUlJ' };
    const group = { name: 'group', roleId: 'role-1', allSite: false, sites: ['site-1'] };

    beforeEach(() => {
        request = {
            post: vi.fn(async () => ok),
            put: vi.fn(async () => ok),
            delete: vi.fn(async () => ok),
            fetchPaginated: vi.fn(async () => [{ id: 'a' }]),
            ensureSuccess: vi.fn((response: OmadaApiResponse<unknown>) => response.result),
        };
        ops = new AccountOperations(request as unknown as RequestHandler, (path) => `/openapi/v1/c${path}`);
    });

    it('creates, modifies and deletes roles on the documented routes', async () => {
        await expect(ops.createRole(role)).resolves.toEqual({ id: 'x' });
        expect(request.post).toHaveBeenCalledWith('/openapi/v1/c/roles', role, undefined);
        await ops.updateRole('r/1', role, { h: '1' });
        expect(request.put).toHaveBeenCalledWith('/openapi/v1/c/roles/r%2F1', role, { h: '1' });
        await ops.deleteRole('r/1');
        expect(request.delete).toHaveBeenCalledWith('/openapi/v1/c/roles/r%2F1', undefined);
    });

    it('rejects undocumented role fields before sending', async () => {
        await expect(ops.createRole({ ...role, extra: true } as never)).rejects.toThrow();
        expect(request.post).not.toHaveBeenCalled();
    });

    it('sets the MFA status', async () => {
        await ops.setMfaStatus({ enable: true });
        expect(request.post).toHaveBeenCalledWith('/openapi/v1/c/mfa/status', { enable: true }, undefined);
    });

    it('manages SAML identity providers', async () => {
        await expect(ops.listSamlIdps()).resolves.toEqual([{ id: 'a' }]);
        expect(request.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/c/sso/saml-idps', {}, undefined);
        await ops.createSamlIdp(idp);
        expect(request.post).toHaveBeenCalledWith('/openapi/v1/c/sso/saml-idps', idp, undefined);
        await ops.updateSamlIdp('i1', idp);
        expect(request.put).toHaveBeenCalledWith('/openapi/v1/c/sso/saml-idps/i1', idp, undefined);
        await ops.deleteSamlIdp('i1');
        expect(request.delete).toHaveBeenCalledWith('/openapi/v1/c/sso/saml-idps/i1', undefined);
    });

    it('manages external user groups and lists external users', async () => {
        await ops.listExternalUserGroups();
        expect(request.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/c/sso/external-user-groups', {}, undefined);
        await ops.createExternalUserGroup(group);
        expect(request.post).toHaveBeenCalledWith('/openapi/v1/c/sso/external-user-groups', group, undefined);
        await ops.updateExternalUserGroup('g1', group);
        expect(request.put).toHaveBeenCalledWith('/openapi/v1/c/sso/external-user-groups/g1', group, undefined);
        await ops.deleteExternalUserGroup('g1');
        expect(request.delete).toHaveBeenCalledWith('/openapi/v1/c/sso/external-user-groups/g1', undefined);
        await ops.listExternalUsers({ h: '1' });
        expect(request.fetchPaginated).toHaveBeenCalledWith('/openapi/v1/c/sso/external-users', {}, { h: '1' });
    });
});
