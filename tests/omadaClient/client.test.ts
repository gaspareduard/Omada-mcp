import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientOperations } from '../../src/omadaClient/client.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { ActiveClientInfo, ClientActivity, ClientPastConnection, OmadaApiResponse, OmadaClientInfo } from '../../src/types/index.js';

describe('omadaClient/client', () => {
    let mockRequest: RequestHandler;
    let mockSite: SiteOperations;
    let buildPath: (path: string) => string;
    let clientOps: ClientOperations;

    beforeEach(() => {
        mockRequest = {
            fetchPaginated: vi.fn(),
            get: vi.fn(),
            ensureSuccess: vi.fn((response) => response.result),
        } as unknown as RequestHandler;

        mockSite = {
            resolveSiteId: vi.fn((siteId) => siteId ?? 'default-site'),
        } as unknown as SiteOperations;

        buildPath = (path: string) => `/api${path}`;

        clientOps = new ClientOperations(mockRequest, mockSite, buildPath);
    });

    describe('listClients', () => {
        it('should fetch paginated list of clients', async () => {
            const mockClients: OmadaClientInfo[] = [
                { mac: '00:11:22:33:44:55', name: 'Client 1', id: 'client-1' } as OmadaClientInfo,
                { mac: '00:11:22:33:44:66', name: 'Client 2', id: 'client-2' } as OmadaClientInfo,
            ];

            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockClients);

            const clients = await clientOps.listClients('test-site');

            expect(clients).toEqual(mockClients);
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('test-site');
            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/api/sites/test-site/clients');
        });

        it('should use default siteId if not provided', async () => {
            const mockClients: OmadaClientInfo[] = [];
            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockClients);

            await clientOps.listClients();

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/api/sites/default-site/clients');
        });
    });

    describe('getClient', () => {
        it('should find client by MAC address', async () => {
            const mockClients: OmadaClientInfo[] = [
                { mac: '00:11:22:33:44:55', name: 'Client 1', id: 'client-1' } as OmadaClientInfo,
                { mac: '00:11:22:33:44:66', name: 'Client 2', id: 'client-2' } as OmadaClientInfo,
            ];

            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockClients);

            const client = await clientOps.getClient('00:11:22:33:44:66', 'test-site');

            expect(client).toEqual(mockClients[1]);
        });

        it('should find client by client ID', async () => {
            const mockClients: OmadaClientInfo[] = [
                { mac: '00:11:22:33:44:55', name: 'Client 1', id: 'client-1' } as OmadaClientInfo,
                { mac: '00:11:22:33:44:66', name: 'Client 2', id: 'client-2' } as OmadaClientInfo,
            ];

            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockClients);

            const client = await clientOps.getClient('client-1', 'test-site');

            expect(client).toEqual(mockClients[0]);
        });

        it('should return undefined if client not found', async () => {
            const mockClients: OmadaClientInfo[] = [];
            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockClients);

            const client = await clientOps.getClient('nonexistent', 'test-site');

            expect(client).toBeUndefined();
        });
    });

    describe('listMostActiveClients', () => {
        it('should fetch most active clients', async () => {
            const mockClients: ActiveClientInfo[] = [
                {
                    mac: '00:11:22:33:44:55',
                    name: 'Client 1',
                    trafficDown: 1000,
                    trafficUp: 500,
                    wireless: false,
                    type: 'wired',
                    model: 'PC',
                    totalTraffic: 1500,
                } as ActiveClientInfo,
            ];

            const mockResponse: OmadaApiResponse<ActiveClientInfo[]> = {
                errorCode: 0,
                msg: 'Success',
                result: mockClients,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            const clients = await clientOps.listMostActiveClients('test-site');

            expect(clients).toEqual(mockClients);
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('test-site');
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/test-site/dashboard/active-clients');
        });

        it('should use default siteId if not provided', async () => {
            const mockClients: ActiveClientInfo[] = [];
            const mockResponse: OmadaApiResponse<ActiveClientInfo[]> = {
                errorCode: 0,
                msg: 'Success',
                result: mockClients,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            await clientOps.listMostActiveClients();

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/default-site/dashboard/active-clients');
        });

        it('should return empty array if result is undefined', async () => {
            const mockResponse: OmadaApiResponse<ActiveClientInfo[]> = {
                errorCode: 0,
                msg: 'Success',
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            const clients = await clientOps.listMostActiveClients();

            expect(clients).toEqual([]);
        });
    });

    describe('listClientsActivity', () => {
        it('should fetch client activity with no options', async () => {
            const mockActivity: ClientActivity[] = [
                {
                    time: 1640000000,
                    newEapClientNum: 5,
                    newSwitchClientNum: 2,
                    activeEapClientNum: 10,
                    activeSwitchClientNum: 8,
                    disconnectEapClientNum: 1,
                    disconnectSwitchClientNum: 1,
                } as ClientActivity,
            ];

            const mockResponse: OmadaApiResponse<ClientActivity[]> = {
                errorCode: 0,
                msg: 'Success',
                result: mockActivity,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            const activity = await clientOps.listClientsActivity();

            expect(activity).toEqual(mockActivity);
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/default-site/dashboard/client-activity', {});
        });

        it('should fetch client activity with start and end timestamps', async () => {
            const mockActivity: ClientActivity[] = [];
            const mockResponse: OmadaApiResponse<ClientActivity[]> = {
                errorCode: 0,
                msg: 'Success',
                result: mockActivity,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            await clientOps.listClientsActivity({
                siteId: 'test-site',
                start: 1640000000,
                end: 1640100000,
            });

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('test-site');
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/test-site/dashboard/client-activity', {
                start: 1640000000,
                end: 1640100000,
            });
        });

        it('should return empty array if result is undefined', async () => {
            const mockResponse: OmadaApiResponse<ClientActivity[]> = {
                errorCode: 0,
                msg: 'Success',
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

            const activity = await clientOps.listClientsActivity();

            expect(activity).toEqual([]);
        });
    });

    describe('listClientsPastConnections', () => {
        it('should fetch past connections with required options', async () => {
            const mockConnections: ClientPastConnection[] = [
                {
                    mac: '00:11:22:33:44:55',
                    name: 'Client 1',
                    lastSeen: 1640000000000,
                    firstSeen: 1639990000000,
                    download: 1000000,
                    upload: 500000,
                    duration: 3600,
                } as ClientPastConnection,
            ];

            const mockPaginatedResult = {
                data: mockConnections,
                totalRows: 1,
                currentPage: 1,
                currentSize: 1,
            };

            const mockResponse: OmadaApiResponse<typeof mockPaginatedResult> = {
                errorCode: 0,
                msg: 'Success',
                result: mockPaginatedResult,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockPaginatedResult);

            const connections = await clientOps.listClientsPastConnections({
                page: 1,
                pageSize: 50,
            });

            expect(connections).toEqual(mockConnections);
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/default-site/insight/past-connection', {
                page: 1,
                pageSize: 50,
            });
            expect(mockRequest.ensureSuccess).toHaveBeenCalledWith(mockResponse);
        });

        it('should include all optional parameters when provided', async () => {
            const mockPaginatedResult = {
                data: [],
                totalRows: 0,
                currentPage: 1,
                currentSize: 0,
            };

            const mockResponse: OmadaApiResponse<typeof mockPaginatedResult> = {
                errorCode: 0,
                msg: 'Success',
                result: mockPaginatedResult,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockPaginatedResult);

            await clientOps.listClientsPastConnections({
                siteId: 'test-site',
                page: 2,
                pageSize: 100,
                sortLastSeen: 'desc',
                timeStart: 1640000000000,
                timeEnd: 1640100000000,
                guest: true,
                searchKey: 'test',
            });

            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/test-site/insight/past-connection', {
                page: 2,
                pageSize: 100,
                'sorts.lastSeen': 'desc',
                'filters.timeStart': '1640000000000',
                'filters.timeEnd': '1640100000000',
                'filters.guest': 'true',
                searchKey: 'test',
            });
        });

        it('should return empty array if data is undefined', async () => {
            const mockPaginatedResult = {
                totalRows: 0,
                currentPage: 1,
                currentSize: 0,
            };

            const mockResponse: OmadaApiResponse<typeof mockPaginatedResult> = {
                errorCode: 0,
                msg: 'Success',
                result: mockPaginatedResult,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockPaginatedResult as never);

            const connections = await clientOps.listClientsPastConnections({
                page: 1,
                pageSize: 50,
            });

            expect(connections).toEqual([]);
        });
    });
});
