import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import { SecurityOperations } from '../../src/omadaClient/security.js';
import type { GetThreatListOptions, PaginatedResult, ThreatInfo } from '../../src/types/index.js';

describe('omadaClient/security', () => {
    let mockRequest: RequestHandler;
    let buildPath: (path: string) => string;
    let securityOps: SecurityOperations;

    beforeEach(() => {
        mockRequest = {
            request: vi.fn(),
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
});
