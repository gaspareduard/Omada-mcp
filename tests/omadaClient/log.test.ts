import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LogOperations } from '../../src/omadaClient/log.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse, PaginatedResult } from '../../src/types/index.js';

describe('LogOperations', () => {
    let logOps: LogOperations;
    let mockRequest: RequestHandler;
    let mockSite: SiteOperations;
    let mockBuildPath: (path: string, version?: string) => string;

    const makePaginatedResponse = (data: unknown[] = []): OmadaApiResponse<PaginatedResult<unknown>> => ({
        errorCode: 0,
        result: { data, totalRows: data.length, currentPage: 1, currentSize: data.length },
    });

    beforeEach(() => {
        mockRequest = {
            get: vi.fn(),
            fetchPaginated: vi.fn(),
            ensureSuccess: vi.fn((response: OmadaApiResponse<unknown>) => {
                if (response.errorCode === 0) {
                    return response.result;
                }
                throw new Error(response.msg ?? 'API Error');
            }),
        } as unknown as RequestHandler;

        mockSite = {
            resolveSiteId: vi.fn((siteId?: string) => siteId ?? 'default-site'),
        } as unknown as SiteOperations;

        mockBuildPath = vi.fn((path: string, version = 'v1') => `/openapi/${version}/test-omadac${path}`);

        logOps = new LogOperations(mockRequest, mockSite, mockBuildPath);
    });

    describe('listSiteEvents', () => {
        it('should list site events', async () => {
            const mockEvent = { id: 'event-1', type: 'info', message: 'Device connected' };
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([mockEvent]));

            const result = await logOps.listSiteEvents({ page: 1, pageSize: 10 }, 'site-123');

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-123');
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/logs/events', { page: 1, pageSize: 10 }, undefined);
            expect(result.data).toEqual([mockEvent]);
        });

        it('should include optional filters', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse());

            await logOps.listSiteEvents({ page: 1, pageSize: 10, startTime: 1000000, endTime: 2000000, searchKey: 'device' }, 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    'filters.startTime': 1000000,
                    'filters.endTime': 2000000,
                    searchKey: 'device',
                }),
                undefined
            );
        });
    });

    describe('listSiteAlerts', () => {
        it('should list site alerts', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([{ id: 'alert-1' }]));

            const result = await logOps.listSiteAlerts({ page: 1, pageSize: 10 }, 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/logs/alerts', { page: 1, pageSize: 10 }, undefined);
            expect(result.data).toHaveLength(1);
        });
    });

    describe('listSiteAuditLogs', () => {
        it('should list site audit logs', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([{ id: 'audit-1', action: 'login' }]));

            const result = await logOps.listSiteAuditLogs({ page: 1, pageSize: 10 }, 'site-123');

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/site-123/audit-logs', { page: 1, pageSize: 10 }, undefined);
            expect(result.data).toHaveLength(1);
        });
    });

    describe('listGlobalEvents', () => {
        it('should list global events without a siteId', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([{ id: 'global-event-1' }]));

            const result = await logOps.listGlobalEvents({ page: 1, pageSize: 10 });

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/logs/events', { page: 1, pageSize: 10 }, undefined);
            expect(result.data).toHaveLength(1);
        });

        it('should include optional filters for global events', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse());

            await logOps.listGlobalEvents({ page: 1, pageSize: 10, startTime: 1000, endTime: 2000, searchKey: 'test' });

            expect(mockRequest.get).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    'filters.startTime': 1000,
                    'filters.endTime': 2000,
                    searchKey: 'test',
                }),
                undefined
            );
        });
    });

    describe('listGlobalAlerts', () => {
        it('should list global alerts', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([{ id: 'global-alert-1' }]));

            const result = await logOps.listGlobalAlerts({ page: 1, pageSize: 10 });

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/logs/alerts', { page: 1, pageSize: 10 }, undefined);
            expect(result.data).toHaveLength(1);
        });
    });

    describe('listGlobalAuditLogs', () => {
        it('should list global audit logs', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([{ id: 'global-audit-1' }]));

            const result = await logOps.listGlobalAuditLogs({ page: 1, pageSize: 10 });

            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/audit-logs', { page: 1, pageSize: 10 }, undefined);
            expect(result.data).toHaveLength(1);
        });
    });

    const makeSimpleResponse = (result: unknown = {}): { errorCode: number; result: unknown } => ({
        errorCode: 0,
        result,
    });

    describe('getLogSettingForSite', () => {
        it('should get site log notification settings (v1)', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makeSimpleResponse({ enabled: true }));
            await logOps.getLogSettingForSite();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/default-site/site/log-notification', undefined, undefined);
        });
    });

    describe('getLogSettingForSiteV2', () => {
        it('should get site log notification settings (v2)', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makeSimpleResponse({}));
            await logOps.getLogSettingForSiteV2();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v2/test-omadac/sites/default-site/site/log-notification', undefined, undefined);
        });
    });

    describe('getAuditLogSettingForSite', () => {
        it('should get site audit log notification settings', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makeSimpleResponse({}));
            await logOps.getAuditLogSettingForSite();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/sites/default-site/site/audit-notification', undefined, undefined);
        });
    });

    describe('getLogSettingForGlobal', () => {
        it('should get global log notification settings (v1)', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makeSimpleResponse({}));
            await logOps.getLogSettingForGlobal();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/log-notification', undefined, undefined);
        });
    });

    describe('getLogSettingForGlobalV2', () => {
        it('should get global log notification settings (v2)', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makeSimpleResponse({}));
            await logOps.getLogSettingForGlobalV2();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v2/test-omadac/log-notification', undefined, undefined);
        });
    });

    describe('getAuditLogSettingForGlobal', () => {
        it('should get global audit log notification settings', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makeSimpleResponse({}));
            await logOps.getAuditLogSettingForGlobal();
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/audit-notification', undefined, undefined);
        });
    });

    describe('getAuditLogsForGlobal', () => {
        it('should get global audit logs with pagination only', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makeSimpleResponse({ data: [] }));
            await logOps.getAuditLogsForGlobal(1, 10);
            expect(mockRequest.get).toHaveBeenCalledWith('/openapi/v1/test-omadac/audit-logs', { page: 1, pageSize: 10 }, undefined);
        });

        it('should pass optional filters', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makeSimpleResponse({ data: [] }));
            await logOps.getAuditLogsForGlobal(1, 10, { sortTime: 'desc', filterLevel: 'warning', searchKey: 'admin' });
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/audit-logs',
                { page: 1, pageSize: 10, 'sorts.time': 'desc', 'filters.level': 'warning', searchKey: 'admin' },
                undefined
            );
        });
    });

    describe('listSiteAlerts - optional params', () => {
        it('should pass optional startTime, endTime, searchKey', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([{ id: 'alert-1' }]));
            await logOps.listSiteAlerts({ page: 1, pageSize: 10, startTime: 1640000000000, endTime: 1640100000000, searchKey: 'test' }, 'site-123');
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/logs/alerts',
                { page: 1, pageSize: 10, 'filters.startTime': 1640000000000, 'filters.endTime': 1640100000000, searchKey: 'test' },
                undefined
            );
        });
    });

    describe('listSiteAuditLogs - optional params', () => {
        it('should pass optional startTime, endTime, searchKey', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([{ id: 'audit-1' }]));
            await logOps.listSiteAuditLogs(
                { page: 1, pageSize: 10, startTime: 1640000000000, endTime: 1640100000000, searchKey: 'test' },
                'site-123'
            );
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/sites/site-123/audit-logs',
                { page: 1, pageSize: 10, 'filters.startTime': 1640000000000, 'filters.endTime': 1640100000000, searchKey: 'test' },
                undefined
            );
        });
    });

    describe('listGlobalAuditLogs - optional params', () => {
        it('should pass optional startTime, endTime, searchKey', async () => {
            vi.mocked(mockRequest.get).mockResolvedValue(makePaginatedResponse([{ id: 'audit-1' }]));

            const result = await logOps.listGlobalAuditLogs({
                page: 1,
                pageSize: 10,
                startTime: 1640000000000,
                endTime: 1640100000000,
                searchKey: 'admin',
            });

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/openapi/v1/test-omadac/audit-logs',
                { page: 1, pageSize: 10, 'filters.startTime': 1640000000000, 'filters.endTime': 1640100000000, searchKey: 'admin' },
                undefined
            );
            expect(result.data).toHaveLength(1);
        });
    });
});
