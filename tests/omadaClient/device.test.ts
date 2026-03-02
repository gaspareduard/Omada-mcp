import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceOperations } from '../../src/omadaClient/device.js';
import type { RequestHandler } from '../../src/omadaClient/request.js';
import type { SiteOperations } from '../../src/omadaClient/site.js';
import type { OmadaApiResponse, OmadaDeviceInfo, OmadaDeviceStats, OswStackDetail } from '../../src/types/index.js';

describe('omadaClient/device', () => {
    let mockRequest: RequestHandler;
    let mockSite: SiteOperations;
    let buildPath: (path: string) => string;
    let deviceOps: DeviceOperations;

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

        deviceOps = new DeviceOperations(mockRequest, mockSite, buildPath);
    });

    describe('listDevices', () => {
        it('should fetch paginated list of devices', async () => {
            const mockDevices: OmadaDeviceInfo[] = [
                { mac: '00:11:22:33:44:55', name: 'Device 1', deviceId: 'dev-1' } as OmadaDeviceInfo,
                { mac: '00:11:22:33:44:66', name: 'Device 2', deviceId: 'dev-2' } as OmadaDeviceInfo,
            ];

            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevices);

            const devices = await deviceOps.listDevices('test-site');

            expect(devices).toEqual(mockDevices);
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('test-site');
            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/api/sites/test-site/devices', {}, undefined);
        });

        it('should use default siteId if not provided', async () => {
            const mockDevices: OmadaDeviceInfo[] = [];
            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevices);

            await deviceOps.listDevices();

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/api/sites/default-site/devices', {}, undefined);
        });
    });

    describe('getDevice', () => {
        it('should find device by MAC address', async () => {
            const mockDevices: OmadaDeviceInfo[] = [
                { mac: '00:11:22:33:44:55', name: 'Device 1', deviceId: 'dev-1' } as OmadaDeviceInfo,
                { mac: '00:11:22:33:44:66', name: 'Device 2', deviceId: 'dev-2' } as OmadaDeviceInfo,
            ];

            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevices);

            const device = await deviceOps.getDevice('00:11:22:33:44:66', 'test-site');

            expect(device).toEqual(mockDevices[1]);
        });

        it('should find device by device ID', async () => {
            const mockDevices: OmadaDeviceInfo[] = [
                { mac: '00:11:22:33:44:55', name: 'Device 1', deviceId: 'dev-1' } as OmadaDeviceInfo,
                { mac: '00:11:22:33:44:66', name: 'Device 2', deviceId: 'dev-2' } as OmadaDeviceInfo,
            ];

            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevices);

            const device = await deviceOps.getDevice('dev-1', 'test-site');

            expect(device).toEqual(mockDevices[0]);
        });

        it('should return undefined if device not found', async () => {
            const mockDevices: OmadaDeviceInfo[] = [];
            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevices);

            const device = await deviceOps.getDevice('nonexistent', 'test-site');

            expect(device).toBeUndefined();
        });
    });

    describe('getSwitchStackDetail', () => {
        it('should get switch stack details', async () => {
            const mockStack: OswStackDetail = {
                stackId: 'stack-1',
                stackName: 'Test Stack',
            } as OswStackDetail;

            const mockResponse: OmadaApiResponse<OswStackDetail> = {
                errorCode: 0,
                msg: 'Success',
                result: mockStack,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockStack);

            const stack = await deviceOps.getSwitchStackDetail('stack-1', 'test-site');

            expect(stack).toEqual(mockStack);
            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('test-site');
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/test-site/stacks/stack-1', undefined, undefined);
            expect(mockRequest.ensureSuccess).toHaveBeenCalledWith(mockResponse);
        });

        it('should throw error if stackId is empty', async () => {
            await expect(deviceOps.getSwitchStackDetail('', 'test-site')).rejects.toThrow('A stack id must be provided.');
        });

        it('should use default siteId if not provided', async () => {
            const mockStack: OswStackDetail = {
                stackId: 'stack-1',
                stackName: 'Test Stack',
            } as OswStackDetail;

            const mockResponse: OmadaApiResponse<OswStackDetail> = {
                errorCode: 0,
                msg: 'Success',
                result: mockStack,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockStack);

            await deviceOps.getSwitchStackDetail('stack-1');

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/default-site/stacks/stack-1', undefined, undefined);
        });
    });

    describe('searchDevices', () => {
        it('should search devices globally', async () => {
            const mockDevices: OmadaDeviceInfo[] = [{ mac: '00:11:22:33:44:55', name: 'Device 1', deviceId: 'dev-1' } as OmadaDeviceInfo];

            const mockResponse: OmadaApiResponse<OmadaDeviceInfo[]> = {
                errorCode: 0,
                msg: 'Success',
                result: mockDevices,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockDevices);

            const devices = await deviceOps.searchDevices('Device 1');

            expect(devices).toEqual(mockDevices);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/devices?searchKey=Device%201', undefined, undefined);
            expect(mockRequest.ensureSuccess).toHaveBeenCalledWith(mockResponse);
        });
    });

    describe('listDevicesStats', () => {
        it('should fetch device stats with required options', async () => {
            const mockStats: OmadaDeviceStats = {
                page: 1,
                pageSize: 50,
                totalRows: 1,
                data: [{ mac: '00:11:22:33:44:55', name: 'Device 1' } as OmadaDeviceInfo],
            } as OmadaDeviceStats;

            const mockResponse: OmadaApiResponse<OmadaDeviceStats> = {
                errorCode: 0,
                msg: 'Success',
                result: mockStats,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockStats);

            const stats = await deviceOps.listDevicesStats({
                page: 1,
                pageSize: 50,
            });

            expect(stats).toEqual(mockStats);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/devices/stat?page=1&pageSize=50', undefined, undefined);
            expect(mockRequest.ensureSuccess).toHaveBeenCalledWith(mockResponse);
        });

        it('should include all optional search and filter parameters', async () => {
            const mockStats: OmadaDeviceStats = {
                page: 2,
                pageSize: 100,
                totalRows: 0,
                data: [],
            } as OmadaDeviceStats;

            const mockResponse: OmadaApiResponse<OmadaDeviceStats> = {
                errorCode: 0,
                msg: 'Success',
                result: mockStats,
            };

            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockStats);

            await deviceOps.listDevicesStats({
                page: 2,
                pageSize: 100,
                searchMacs: '00:11:22:33:44:55,AA:BB:CC:DD:EE:FF',
                searchNames: 'Device 1,Device 2',
                searchModels: 'EAP650,EAP670',
                searchSns: 'SN001,SN002',
                filterTag: 'building-a',
                filterDeviceSeriesType: 'eap',
            });

            expect(mockRequest.get).toHaveBeenCalledWith(
                '/api/devices/stat?page=2&pageSize=100&searchMacs=00%3A11%3A22%3A33%3A44%3A55%2CAA%3ABB%3ACC%3ADD%3AEE%3AFF&searchNames=Device+1%2CDevice+2&searchModels=EAP650%2CEAP670&searchSns=SN001%2CSN002&filters.tag=building-a&filters.deviceSeriesType=eap',
                undefined,
                undefined
            );
        });
    });
});
