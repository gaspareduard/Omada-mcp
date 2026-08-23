import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequestHandler } from '../../src/omadaClient/request.js';
import { ScheduleOperations } from '../../src/omadaClient/schedules.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse } from '../../src/types/index.js';

describe('ScheduleOperations', () => {
    let scheduleOps: ScheduleOperations;
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
            resolveSiteId: vi.fn(async (siteId?: string) => siteId ?? 'default-site'),
        } as unknown as SiteOperations;
        mockBuildPath = vi.fn((path: string) => `/openapi/v1/test-omadac${path}`);
        scheduleOps = new ScheduleOperations(mockRequest, mockSite, mockBuildPath);
    });

    describe('getUpgradeScheduleList', () => {
        it('should call correct endpoint with default siteId', async () => {
            const mockResponse = { errorCode: 0, result: { schedules: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await scheduleOps.getUpgradeScheduleList();
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/default-site/upgrade-schedules', undefined, undefined);
            expect(result).toEqual({ schedules: [] });
        });

        it('should pass siteId', async () => {
            const mockResponse = { errorCode: 0, result: { schedules: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getUpgradeScheduleList('site-123');
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/upgrade-schedules', undefined, undefined);
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getUpgradeScheduleList(undefined, { 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });

        it('should throw on API error', async () => {
            const mockResponse = { errorCode: 1, msg: 'Not Found' };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockImplementation(() => {
                throw new Error('Not Found');
            });
            await expect(scheduleOps.getUpgradeScheduleList()).rejects.toThrow('Not Found');
        });
    });

    describe('getRebootScheduleList', () => {
        it('should call correct endpoint with siteTemplateId', async () => {
            const mockResponse = { errorCode: 0, result: { schedules: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await scheduleOps.getRebootScheduleList('tmpl-1');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sitetemplates/tmpl-1/reboot-schedules', undefined, undefined);
            expect(result).toEqual({ schedules: [] });
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getRebootScheduleList('tmpl-1', { 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getPoeScheduleList', () => {
        it('should call correct endpoint with default siteId', async () => {
            const mockResponse = { errorCode: 0, result: { schedules: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await scheduleOps.getPoeScheduleList();
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/default-site/poe-schedules', undefined, undefined);
            expect(result).toEqual({ schedules: [] });
        });

        it('should pass siteId', async () => {
            const mockResponse = { errorCode: 0, result: { schedules: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getPoeScheduleList('site-123');
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/poe-schedules', undefined, undefined);
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getPoeScheduleList(undefined, { 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getPortScheduleList', () => {
        it('should call correct endpoint with default siteId', async () => {
            const mockResponse = { errorCode: 0, result: { schedules: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await scheduleOps.getPortScheduleList();
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/default-site/port-schedules', undefined, undefined);
            expect(result).toEqual({ schedules: [] });
        });

        it('should pass siteId', async () => {
            const mockResponse = { errorCode: 0, result: { schedules: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getPortScheduleList('site-123');
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/port-schedules', undefined, undefined);
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getPortScheduleList(undefined, { 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });

    describe('getPortSchedulePorts', () => {
        it('should call correct endpoint with default siteId', async () => {
            const mockResponse = { errorCode: 0, result: { ports: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            const result = await scheduleOps.getPortSchedulePorts();
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/default-site/port-status-ports', undefined, undefined);
            expect(result).toEqual({ ports: [] });
        });

        it('should pass siteId', async () => {
            const mockResponse = { errorCode: 0, result: { ports: [] } };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getPortSchedulePorts('site-123');
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/port-status-ports', undefined, undefined);
        });

        it('should pass customHeaders', async () => {
            const mockResponse = { errorCode: 0, result: null };
            vi.mocked(mockRequest.get).mockResolvedValue(mockResponse);
            await scheduleOps.getPortSchedulePorts(undefined, { 'X-Custom': 'value' });
            expect(mockRequest.get).toHaveBeenCalledWith(expect.any(String), undefined, { 'X-Custom': 'value' });
        });
    });
});
