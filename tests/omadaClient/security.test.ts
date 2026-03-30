import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import { SecurityOperations } from '../../src/omadaClient/security.js';
import type { GetThreatListOptions, OmadaApiResponse, PaginatedResult, ThreatInfo } from '../../src/types/index.js';

describe('omadaClient/security', () => {
    let mockRequest: RequestHandler;
    let buildPath: (path: string) => string;
    let securityOps: SecurityOperations;

    beforeEach(() => {
        mockRequest = {
            request: vi.fn(),
            get: vi.fn(),
            ensureSuccess: vi.fn((response: { result: unknown }) => response.result),
        } as unknown as RequestHandler;

        buildPath = (path: string) => `/api${path}`;

        securityOps = new SecurityOperations(mockRequest, buildPath);
    });

    describe('getThreatList', () => {
        it('should fetch threat list with required options', async () => {
            const options: GetThreatListOptions = {
                archived: false,
                page: 1,
                pageSize: 50,
                startTime: 1640000000000,
                endTime: 1640100000000,
            };

            const mockResult: PaginatedResult<ThreatInfo> = {
                data: [],
                totalRows: 0,
                currentPage: 1,
                currentSize: 0,
            };

            (mockRequest.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            const result = await securityOps.getThreatList(options);

            expect(result).toEqual(mockResult);
            expect(mockRequest.request).toHaveBeenCalledWith(
                {
                    method: 'GET',
                    url: '/api/security/threat-management',
                    params: {
                        archived: false,
                        page: 1,
                        pageSize: 50,
                        'filters.startTime': 1640000000000,
                        'filters.endTime': 1640100000000,
                    },
                },
                true,
                undefined
            );
        });

        it('should include optional parameters when provided', async () => {
            const options: GetThreatListOptions = {
                archived: true,
                page: 2,
                pageSize: 100,
                startTime: 1640000000000,
                endTime: 1640100000000,
                siteList: 'site1,site2',
                severity: 1,
                sortTime: 'desc',
                searchKey: 'test',
            };

            const mockResult: PaginatedResult<ThreatInfo> = {
                data: [],
                totalRows: 0,
                currentPage: 2,
                currentSize: 0,
            };

            (mockRequest.request as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            await securityOps.getThreatList(options);

            expect(mockRequest.request).toHaveBeenCalledWith(
                {
                    method: 'GET',
                    url: '/api/security/threat-management',
                    params: {
                        archived: true,
                        page: 2,
                        pageSize: 100,
                        'filters.startTime': 1640000000000,
                        'filters.endTime': 1640100000000,
                        siteList: 'site1,site2',
                        'filters.severity': 1,
                        'sorts.time': 'desc',
                        searchKey: 'test',
                    },
                },
                true,
                undefined
            );
        });

        it('should omit undefined optional parameters', async () => {
            const options: GetThreatListOptions = {
                archived: false,
                page: 1,
                pageSize: 50,
                startTime: 1640000000000,
                endTime: 1640100000000,
                // Optional fields not provided
            };

            (mockRequest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
                data: [],
                totalRows: 0,
                currentPage: 1,
                currentSize: 0,
            });

            await securityOps.getThreatList(options);

            const callParams = (mockRequest.request as ReturnType<typeof vi.fn>).mock.calls[0][0].params;
            expect(callParams).not.toHaveProperty('siteList');
            expect(callParams).not.toHaveProperty('filters.severity');
            expect(callParams).not.toHaveProperty('sorts.time');
            expect(callParams).not.toHaveProperty('searchKey');
        });
    });

    describe('getTopThreats', () => {
        it('should return top threats list', async () => {
            const mockThreats = [
                { ip: '1.2.3.4', count: 10 },
                { ip: '5.6.7.8', count: 5 },
            ];
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: mockThreats };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            const result = await securityOps.getTopThreats();

            expect(mockRequest.get).toHaveBeenCalledWith('/api/security/threat-management/top', undefined, undefined);
            expect(result).toEqual(mockThreats);
        });

        it('should return empty array when result is null', async () => {
            const mockResponse = { errorCode: 0, result: null };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            const result = await securityOps.getTopThreats();
            expect(result).toEqual([]);
        });
    });

    describe('getThreatSeverity', () => {
        it('should return threat severity summary', async () => {
            const mockSeverity = { high: 3, medium: 10, low: 25 };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockSeverity };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            const result = await securityOps.getThreatSeverity(1700000000, 1700086400);

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/api/security/threat-management/severity',
                { startTime: 1700000000, endTime: 1700086400 },
                undefined
            );
            expect(result).toEqual(mockSeverity);
        });

        it('should return undefined when result is not present', async () => {
            const mockResponse = { errorCode: 0 };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            const result = await securityOps.getThreatSeverity(1700000000, 1700086400);
            expect(result).toBeUndefined();
        });
    });

    describe('getControllerStatus', () => {
        it('should get controller status', async () => {
            const mockResponse = { errorCode: 0, result: { status: 'running' } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await securityOps.getControllerStatus();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/system/setting/controller-status', undefined, undefined);
            expect(result).toEqual({ status: 'running' });
        });
    });

    describe('getGeneralSettings', () => {
        it('should get global general settings', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getGeneralSettings();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/global/controller/setting/general', undefined, undefined);
        });
    });

    describe('getRetention', () => {
        it('should get data retention settings', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getRetention();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/controller/setting/retention', undefined, undefined);
        });
    });

    describe('getMailServerStatus', () => {
        it('should get mail server status', async () => {
            const mockResponse = { errorCode: 0, result: { connected: true } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await securityOps.getMailServerStatus();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/mail/status', undefined, undefined);
            expect(result).toEqual({ connected: true });
        });
    });

    describe('getWebhookLogsForGlobal', () => {
        it('should get webhook dispatch logs with required params', async () => {
            const mockResponse = { errorCode: 0, result: { data: [] } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getWebhookLogsForGlobal(1, 10, 'wh-1', 1700000000000, 1700086400000);
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/api/webhook/settings/dispatch-logs',
                {
                    page: 1,
                    pageSize: 10,
                    'filters.webhookId': 'wh-1',
                    'filters.timeStart': 1700000000000,
                    'filters.timeEnd': 1700086400000,
                },
                undefined
            );
        });
    });

    describe('getClientActiveTimeout', () => {
        it('should get client active timeout', async () => {
            const mockResponse = { errorCode: 0, result: { timeout: 300 } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getClientActiveTimeout();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/controller/setting/active-timeout', undefined, undefined);
        });
    });

    describe('getRemoteLogging', () => {
        it('should get remote logging config', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getRemoteLogging();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/global/controller/setting/syslog', undefined, undefined);
        });
    });

    describe('getRadiusServer', () => {
        it('should get global RADIUS server config', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getRadiusServer();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/global/controller/setting/network/radius-server', undefined, undefined);
        });
    });

    describe('getLogging', () => {
        it('should get logging config', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getLogging();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/system/setting/logging', undefined, undefined);
        });
    });

    describe('getUiInterface', () => {
        it('should get UI interface settings', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getUiInterface();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/controller/setting/ui-interface', undefined, undefined);
        });
    });

    describe('getDeviceAccessManagement', () => {
        it('should get device access management settings', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getDeviceAccessManagement();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/controller/setting/services/device-access', undefined, undefined);
        });
    });

    describe('getWebhookForGlobal', () => {
        it('should get webhook settings', async () => {
            const mockResponse = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            await securityOps.getWebhookForGlobal();
            expect(mockRequest.get).toHaveBeenCalledWith('/api/webhook/settings', undefined, undefined);
        });
    });
});
