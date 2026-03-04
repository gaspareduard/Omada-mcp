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

    describe('getSwitchDetail', () => {
        it('should get switch detail by MAC', async () => {
            const mockDetail = { mac: 'AA:BB:CC:DD:EE:FF', model: 'TL-SG3428', ports: 28 };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockDetail };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockDetail);

            const result = await deviceOps.getSwitchDetail('AA:BB:CC:DD:EE:FF', 'site-1');

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-1');
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/switches/AA%3ABB%3ACC%3ADD%3AEE%3AFF', undefined, undefined);
            expect(result).toEqual(mockDetail);
        });

        it('should throw when switchMac is empty', async () => {
            await expect(deviceOps.getSwitchDetail('')).rejects.toThrow('A switchMac must be provided.');
        });
    });

    describe('getGatewayDetail', () => {
        it('should get gateway detail by MAC', async () => {
            const mockDetail = { mac: 'AA:BB:CC:DD:EE:FF', model: 'ER7206' };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockDetail };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockDetail);

            const result = await deviceOps.getGatewayDetail('AA:BB:CC:DD:EE:FF', 'site-1');

            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/gateways/AA%3ABB%3ACC%3ADD%3AEE%3AFF', undefined, undefined);
            expect(result).toEqual(mockDetail);
        });

        it('should throw when gatewayMac is empty', async () => {
            await expect(deviceOps.getGatewayDetail('')).rejects.toThrow('A gatewayMac must be provided.');
        });
    });

    describe('getGatewayWanStatus', () => {
        it('should get gateway WAN status', async () => {
            const mockStatus = { wan1: { connected: true } };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockStatus };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockStatus);

            const result = await deviceOps.getGatewayWanStatus('AA:BB:CC:DD:EE:FF', 'site-1');

            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/gateways/AA%3ABB%3ACC%3ADD%3AEE%3AFF/wan-status', undefined, undefined);
            expect(result).toEqual(mockStatus);
        });

        it('should throw when gatewayMac is empty', async () => {
            await expect(deviceOps.getGatewayWanStatus('')).rejects.toThrow('A gatewayMac must be provided.');
        });
    });

    describe('getGatewayLanStatus', () => {
        it('should get gateway LAN status', async () => {
            const mockStatus = { lan1: { connected: true } };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockStatus };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockStatus);

            const result = await deviceOps.getGatewayLanStatus('AA:BB:CC:DD:EE:FF', 'site-1');

            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/gateways/AA%3ABB%3ACC%3ADD%3AEE%3AFF/lan-status', undefined, undefined);
            expect(result).toEqual(mockStatus);
        });

        it('should throw when gatewayMac is empty', async () => {
            await expect(deviceOps.getGatewayLanStatus('')).rejects.toThrow('A gatewayMac must be provided.');
        });
    });

    describe('getGatewayPorts', () => {
        it('should get gateway ports', async () => {
            const mockPorts = [{ id: 'port1', type: 'wan' }];
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: mockPorts };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockPorts);

            const result = await deviceOps.getGatewayPorts('AA:BB:CC:DD:EE:FF', 'site-1');

            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/gateways/AA%3ABB%3ACC%3ADD%3AEE%3AFF/ports', undefined, undefined);
            expect(result).toEqual(mockPorts);
        });

        it('should return empty array when ensureSuccess returns null', async () => {
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: [] };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(null);

            const result = await deviceOps.getGatewayPorts('AA:BB:CC:DD:EE:FF', 'site-1');
            expect(result).toEqual([]);
        });

        it('should throw when gatewayMac is empty', async () => {
            await expect(deviceOps.getGatewayPorts('')).rejects.toThrow('A gatewayMac must be provided.');
        });
    });

    describe('getApDetail', () => {
        it('should get AP detail by MAC', async () => {
            const mockDetail = { mac: 'AA:BB:CC:DD:EE:FF', model: 'EAP670' };
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: mockDetail };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockDetail);

            const result = await deviceOps.getApDetail('AA:BB:CC:DD:EE:FF', 'site-1');

            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA%3ABB%3ACC%3ADD%3AEE%3AFF', undefined, undefined);
            expect(result).toEqual(mockDetail);
        });

        it('should throw when apMac is empty', async () => {
            await expect(deviceOps.getApDetail('')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getApRadios', () => {
        it('should get AP radio info', async () => {
            const mockRadios = [{ band: '5GHz', channel: 36 }];
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: mockRadios };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(mockRadios);

            const result = await deviceOps.getApRadios('AA:BB:CC:DD:EE:FF', 'site-1');

            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA%3ABB%3ACC%3ADD%3AEE%3AFF/radios', undefined, undefined);
            expect(result).toEqual(mockRadios);
        });

        it('should return empty array when ensureSuccess returns null', async () => {
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: [] };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            (mockRequest.ensureSuccess as ReturnType<typeof vi.fn>).mockReturnValue(null);

            const result = await deviceOps.getApRadios('AA:BB:CC:DD:EE:FF', 'site-1');
            expect(result).toEqual([]);
        });

        it('should throw when apMac is empty', async () => {
            await expect(deviceOps.getApRadios('')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getStackPorts', () => {
        it('should get stack ports', async () => {
            const mockPorts = [{ portId: 'p1', speed: '1G' }];
            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockPorts);

            const result = await deviceOps.getStackPorts('stack-1', 'site-1');

            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/api/sites/site-1/stacks/stack-1/ports', {}, undefined);
            expect(result).toEqual(mockPorts);
        });

        it('should throw when stackId is empty', async () => {
            await expect(deviceOps.getStackPorts('')).rejects.toThrow('A stackId must be provided.');
        });
    });

    describe('listPendingDevices', () => {
        it('should list pending devices for a site', async () => {
            const mockDevices = [{ mac: 'AA:BB:CC:DD:EE:FF', type: 'EAP' }];
            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevices);

            const result = await deviceOps.listPendingDevices('site-1');

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith('site-1');
            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/api/sites/site-1/grid/devices/pending', {}, undefined);
            expect(result).toEqual(mockDevices);
        });

        it('should use default site when siteId is not provided', async () => {
            (mockRequest.fetchPaginated as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            await deviceOps.listPendingDevices();

            expect(mockSite.resolveSiteId).toHaveBeenCalledWith(undefined);
            expect(mockRequest.fetchPaginated).toHaveBeenCalledWith('/api/sites/default-site/grid/devices/pending', {}, undefined);
        });
    });
});
