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

    // -------------------------------------------------------------------------
    // Phase 1 Read Tools (issue #36)
    // -------------------------------------------------------------------------

    describe('getAllDeviceBySite', () => {
        it('should fetch all devices including offline', async () => {
            const mockDevices = [{ mac: 'AA:BB:CC:DD:EE:FF' }];
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: mockDevices };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getAllDeviceBySite('site-1');
            expect(result).toEqual(mockDevices);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/devices/all', undefined, undefined);
        });
    });

    describe('getFirmwareInfo', () => {
        it('should return firmware info for a device', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { latestFirmware: '1.2.3' } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getFirmwareInfo('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ latestFirmware: '1.2.3' });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/devices/AA-BB-CC-DD-EE-FF/latest-firmware-info', undefined, undefined);
        });

        it('should throw if deviceMac is empty', async () => {
            await expect(deviceOps.getFirmwareInfo('', 'site-1')).rejects.toThrow('A deviceMac must be provided.');
        });
    });

    describe('getGridAutoCheckUpgrade', () => {
        it('should return upgrade plan list', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getGridAutoCheckUpgrade(1, 10);
            expect(result).toEqual({ data: [] });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/upgrade/autoCheck', { page: 1, pageSize: 10 }, undefined);
        });
    });

    describe('listSwitchNetworks', () => {
        it('should return switch VLAN network list', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.listSwitchNetworks('AA-BB-CC-DD-EE-FF', 1, 10, 'site-1');
            expect(result).toEqual({ data: [] });
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/api/sites/site-1/switches/AA-BB-CC-DD-EE-FF/networks',
                { page: 1, pageSize: 10 },
                undefined
            );
        });

        it('should throw if switchMac is empty', async () => {
            await expect(deviceOps.listSwitchNetworks('', 1, 10, 'site-1')).rejects.toThrow('A switchMac must be provided.');
        });
    });

    describe('getSwitchGeneralConfig', () => {
        it('should return switch general config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { ledEnabled: true } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getSwitchGeneralConfig('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ ledEnabled: true });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/switches/AA-BB-CC-DD-EE-FF/general-config', undefined, undefined);
        });

        it('should throw if switchMac is empty', async () => {
            await expect(deviceOps.getSwitchGeneralConfig('', 'site-1')).rejects.toThrow('A switchMac must be provided.');
        });
    });

    describe('getCableTestLogs', () => {
        it('should return cable test logs', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { logs: [] } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getCableTestLogs('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ logs: [] });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/cable-test/switches/AA-BB-CC-DD-EE-FF/logs', undefined, undefined);
        });

        it('should throw if switchMac is empty', async () => {
            await expect(deviceOps.getCableTestLogs('', 'site-1')).rejects.toThrow('A switchMac must be provided.');
        });
    });

    describe('getCableTestFullResults', () => {
        it('should return full cable test results', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { ports: [] } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getCableTestFullResults('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ ports: [] });
            expect(mockRequest.get).toHaveBeenCalledWith(
                '/api/sites/site-1/cable-test/switches/AA-BB-CC-DD-EE-FF/full-results',
                undefined,
                undefined
            );
        });

        it('should throw if switchMac is empty', async () => {
            await expect(deviceOps.getCableTestFullResults('', 'site-1')).rejects.toThrow('A switchMac must be provided.');
        });
    });

    describe('getOswStackLagList', () => {
        it('should return stack LAG list', async () => {
            const mockLags = [{ lagId: 'lag-1' }];
            const mockResponse: OmadaApiResponse<unknown[]> = { errorCode: 0, result: mockLags };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getOswStackLagList('stack-1', 'site-1');
            expect(result).toEqual(mockLags);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/stacks/stack-1/lags', undefined, undefined);
        });

        it('should throw if stackId is empty', async () => {
            await expect(deviceOps.getOswStackLagList('', 'site-1')).rejects.toThrow('A stackId must be provided.');
        });
    });

    describe('getStackNetworkList', () => {
        it('should return stack VLAN network list', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { data: [] } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getStackNetworkList('stack-1', 1, 10, 'site-1');
            expect(result).toEqual({ data: [] });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/stacks/stack-1/networks', { page: 1, pageSize: 10 }, undefined);
        });

        it('should throw if stackId is empty', async () => {
            await expect(deviceOps.getStackNetworkList('', 1, 10, 'site-1')).rejects.toThrow('A stackId must be provided.');
        });
    });

    describe('getApUplinkConfig', () => {
        it('should return AP uplink config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { uplinkMode: 1 } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getApUplinkConfig('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ uplinkMode: 1 });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/uplink-config', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getApUplinkConfig('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getRadiosConfig', () => {
        it('should return AP radio config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { radios: [] } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getRadiosConfig('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ radios: [] });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/radio-config', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getRadiosConfig('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getApVlanConfig', () => {
        it('should return AP VLAN config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { managementVlan: 10 } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getApVlanConfig('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ managementVlan: 10 });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/vlan', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getApVlanConfig('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getMeshStatistics', () => {
        it('should return AP mesh statistics', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { linkQuality: 90 } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getMeshStatistics('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ linkQuality: 90 });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/mesh/statistics', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getMeshStatistics('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getRFScanResult', () => {
        it('should return RF scan results', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { channels: [] } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getRFScanResult('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ channels: [] });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/rf-scan-result', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getRFScanResult('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getSpeedTestResults', () => {
        it('should return speed test results', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { download: 500, upload: 200 } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getSpeedTestResults('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ download: 500, upload: 200 });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/speed-test-result', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getSpeedTestResults('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getApSnmpConfig', () => {
        it('should return AP SNMP config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { snmpEnabled: true } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getApSnmpConfig('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ snmpEnabled: true });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/snmp', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getApSnmpConfig('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getApLldpConfig', () => {
        it('should return AP LLDP config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { lldpEnabled: true } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getApLldpConfig('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ lldpEnabled: true });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/lldp', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getApLldpConfig('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getApGeneralConfig', () => {
        it('should return AP general config', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { deviceName: 'AP-1' } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getApGeneralConfig('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ deviceName: 'AP-1' });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/general-config', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getApGeneralConfig('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getUplinkWiredDetail', () => {
        it('should return AP wired uplink detail', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { switchMac: '11:22:33:44:55:66', port: 3 } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getUplinkWiredDetail('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual({ switchMac: '11:22:33:44:55:66', port: 3 });
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/wired-uplink', undefined, undefined);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getUplinkWiredDetail('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });

    describe('getDownlinkWiredDevices', () => {
        it('should return AP wired downlink devices from wiredDownlinkList', async () => {
            const mockDevices = [{ mac: '11:22:33:44:55:66' }];
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: { wiredDownlinkList: mockDevices } };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getDownlinkWiredDevices('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual(mockDevices);
            expect(mockRequest.get).toHaveBeenCalledWith('/api/sites/site-1/aps/AA-BB-CC-DD-EE-FF/wired-downlink', undefined, undefined);
        });

        it('should return empty array when wiredDownlinkList is absent', async () => {
            const mockResponse: OmadaApiResponse<unknown> = { errorCode: 0, result: {} };
            (mockRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
            const result = await deviceOps.getDownlinkWiredDevices('AA-BB-CC-DD-EE-FF', 'site-1');
            expect(result).toEqual([]);
        });

        it('should throw if apMac is empty', async () => {
            await expect(deviceOps.getDownlinkWiredDevices('', 'site-1')).rejects.toThrow('An apMac must be provided.');
        });
    });
});
