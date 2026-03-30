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
