import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControllerOperations } from '../../src/omadaClient/controller.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { OmadaApiResponse } from '../../src/types/index.js';

describe('ControllerOperations', () => {
    let controllerOps: ControllerOperations;
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
        controllerOps = new ControllerOperations(mockRequest, mockBuildPath);
    });

    describe('getDataRetention', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { days: 30 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await controllerOps.getDataRetention();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/retention', undefined, undefined);
            expect(result).toEqual({ days: 30 });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await controllerOps.getDataRetention({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });

        it('should throw on API error', async () => {
            const mockResponse = { errorCode: 1, msg: 'Unauthorized' };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockImplementation(() => {
                throw new Error('Unauthorized');
            });
            await expect(controllerOps.getDataRetention()).rejects.toThrow('Unauthorized');
        });
    });

    describe('getControllerPort', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { port: 8043 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await controllerOps.getControllerPort();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/system/setting/controller-port', undefined, undefined);
            expect(result).toEqual({ port: 8043 });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await controllerOps.getControllerPort({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getPortalPort', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { port: 8080 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await controllerOps.getPortalPort();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/system/setting/portal-port', undefined, undefined);
            expect(result).toEqual({ port: 8080 });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await controllerOps.getPortalPort({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getCertificate', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { type: 'self-signed' } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await controllerOps.getCertificate();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/system/setting/certificate', undefined, undefined);
            expect(result).toEqual({ type: 'self-signed' });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await controllerOps.getCertificate({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getExperienceImprovement', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { enabled: true } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await controllerOps.getExperienceImprovement();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/global/controller/setting/exp-improve', undefined, undefined);
            expect(result).toEqual({ enabled: true });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await controllerOps.getExperienceImprovement({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getGlobalDashboardOverview', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { sites: 3 } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await controllerOps.getGlobalDashboardOverview();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/dashboard/overview-without-client', undefined, undefined);
            expect(result).toEqual({ sites: 3 });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await controllerOps.getGlobalDashboardOverview({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getClientHistoryDataEnable', () => {
        it('should call correct endpoint', async () => {
            const mockResponse = { errorCode: 0, result: { enabled: false } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await controllerOps.getClientHistoryDataEnable();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/controller/client/history-enable', undefined, undefined);
            expect(result).toEqual({ enabled: false });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await controllerOps.getClientHistoryDataEnable({ 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });
});
