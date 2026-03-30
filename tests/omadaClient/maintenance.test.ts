import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintenanceOperations } from '../../src/omadaClient/maintenance.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse } from '../../src/types/index.js';

describe('MaintenanceOperations', () => {
    let maintenanceOps: MaintenanceOperations;
    let mockRequest: RequestHandler;
    let mockSite: SiteOperations;
    let mockBuildPath: (path: string) => string;

    beforeEach(() => {
        mockRequest = {
            get: vi.fn(),
            ensureSuccess: vi.fn((response: OmadaApiResponse<unknown>) => {
                if (response.errorCode === 0) return response.result;
                throw new Error(response.msg ?? 'API Error');
            }),
        } as unknown as RequestHandler;
        mockSite = {
            resolveSiteId: vi.fn((siteId?: string) => siteId ?? 'default-site'),
        } as unknown as SiteOperations;
        mockBuildPath = vi.fn((path: string) => `/openapi/v1/test-omadac${path}`);
        maintenanceOps = new MaintenanceOperations(mockRequest, mockSite, mockBuildPath);
    });

    describe('getBackupFileList', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { files: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await maintenanceOps.getBackupFileList();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/maintenance/backup/files', undefined, undefined);
            expect(result).toEqual({ files: [] });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await maintenanceOps.getBackupFileList({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });

        it('should throw on API error', async () => {
            const mockResponse = { errorCode: 1, msg: 'Server Error' };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockImplementation(() => {
                throw new Error('Server Error');
            });
            await expect(maintenanceOps.getBackupFileList()).rejects.toThrow('Server Error');
        });
    });

    describe('getBackupResult', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { status: 'success' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await maintenanceOps.getBackupResult();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/maintenance/backup/result', undefined, undefined);
            expect(result).toEqual({ status: 'success' });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await maintenanceOps.getBackupResult({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getRestoreResult', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { status: 'idle' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await maintenanceOps.getRestoreResult();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/maintenance/restore/result', undefined, undefined);
            expect(result).toEqual({ status: 'idle' });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await maintenanceOps.getRestoreResult({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getSiteBackupResult', () => {
        it('should call correct endpoint with default siteId', async () => {
            const mockResponse = { errorCode: 0, result: { status: 'success' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await maintenanceOps.getSiteBackupResult();
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/default-site/backup/result', undefined, undefined);
            expect(result).toEqual({ status: 'success' });
        });

        it('should pass siteId', async () => {
            const mockResponse = { errorCode: 0, result: { status: 'running' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await maintenanceOps.getSiteBackupResult('site-123');
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/backup/result', undefined, undefined);
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await maintenanceOps.getSiteBackupResult(undefined, { 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getSiteBackupFileList', () => {
        it('should call correct endpoint with default siteId', async () => {
            const mockResponse = { errorCode: 0, result: { files: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await maintenanceOps.getSiteBackupFileList();
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/default-site/maintenance/backup/files', undefined, undefined);
            expect(result).toEqual({ files: [] });
        });

        it('should pass siteId', async () => {
            const mockResponse = { errorCode: 0, result: { files: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await maintenanceOps.getSiteBackupFileList('site-123');
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/maintenance/backup/files', undefined, undefined);
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await maintenanceOps.getSiteBackupFileList(undefined, { 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });
});
