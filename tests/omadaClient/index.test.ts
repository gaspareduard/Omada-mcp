import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EnvironmentConfig } from '../../src/config.js';

type FnMap = Record<string, ReturnType<typeof vi.fn>>;

const siteModule = vi.hoisted(() => {
    const instance: FnMap & { resolveSiteId?: ReturnType<typeof vi.fn> } = {
        listSites: vi.fn().mockResolvedValue([{ id: 'site-1' }]),
    };
    instance.resolveSiteId = vi.fn().mockReturnValue('resolved-site');
    const SiteOperations = vi.fn(function () {
        return instance;
    });
    return { instance, SiteOperations };
});

const deviceModule = vi.hoisted(() => {
    const instance: FnMap = {
        listDevices: vi.fn().mockResolvedValue([{ id: 'device-1' }]),
        getDevice: vi.fn().mockResolvedValue({ id: 'device-1' }),
        getSwitchStackDetail: vi.fn().mockResolvedValue({ id: 'stack' }),
        searchDevices: vi.fn().mockResolvedValue([{ id: 'device-2' }]),
        listDevicesStats: vi.fn().mockResolvedValue({ totalRows: 0 }),
    };
    const DeviceOperations = vi.fn(function () {
        return instance;
    });
    return { instance, DeviceOperations };
});

const clientModule = vi.hoisted(() => {
    const instance: FnMap = {
        listClients: vi.fn().mockResolvedValue([{ id: 'client-1' }]),
        getClient: vi.fn().mockResolvedValue({ id: 'client-1' }),
        listMostActiveClients: vi.fn().mockResolvedValue([{ id: 'active-1' }]),
        listClientsActivity: vi.fn().mockResolvedValue([{ id: 'activity' }]),
        listClientsPastConnections: vi.fn().mockResolvedValue([{ id: 'past' }]),
    };
    const ClientOperations = vi.fn(function () {
        return instance;
    });
    return { instance, ClientOperations };
});

const securityModule = vi.hoisted(() => {
    const instance: FnMap = { getThreatList: vi.fn().mockResolvedValue({ data: [] }) };
    const SecurityOperations = vi.fn(function () {
        return instance;
    });
    return { instance, SecurityOperations };
});

const networkModule = vi.hoisted(() => {
    const instance: FnMap = {
        getInternetInfo: vi.fn().mockResolvedValue({ wan: 'ok' }),
        getPortForwardingStatus: vi.fn().mockResolvedValue({ totalRows: 1 }),
        getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'lan' }]),
        getLanProfileList: vi.fn().mockResolvedValue([{ id: 'profile' }]),
        getWlanGroupList: vi.fn().mockResolvedValue([{ id: 'wlan' }]),
        getSsidList: vi.fn().mockResolvedValue([{ id: 'ssid' }]),
        getSsidDetail: vi.fn().mockResolvedValue({ id: 'ssid-detail' }),
        getFirewallSetting: vi.fn().mockResolvedValue({ rules: [] }),
    };
    const NetworkOperations = vi.fn(function () {
        return instance;
    });
    return { instance, NetworkOperations };
});

const requestModule = vi.hoisted(() => {
    const instance = {
        request: vi.fn().mockResolvedValue({ success: true }),
    } satisfies { request: ReturnType<typeof vi.fn> };
    const RequestHandler = vi.fn(function () {
        return instance;
    });
    return { instance, RequestHandler };
});

const authModule = vi.hoisted(() => ({
    AuthManager: vi.fn(function () {
        return {};
    }),
}));

const axiosModule = vi.hoisted(() => {
    const axiosInstance = { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } };
    const create = vi.fn(() => axiosInstance);
    return { default: { create }, create, axiosInstance };
});

vi.mock('../../src/omadaClient/site.js', () => ({ SiteOperations: siteModule.SiteOperations }));
vi.mock('../../src/omadaClient/device.js', () => ({ DeviceOperations: deviceModule.DeviceOperations }));
vi.mock('../../src/omadaClient/client.js', () => ({ ClientOperations: clientModule.ClientOperations }));
vi.mock('../../src/omadaClient/security.js', () => ({ SecurityOperations: securityModule.SecurityOperations }));
vi.mock('../../src/omadaClient/network.js', () => ({ NetworkOperations: networkModule.NetworkOperations }));
vi.mock('../../src/omadaClient/request.js', () => ({ RequestHandler: requestModule.RequestHandler }));
vi.mock('../../src/omadaClient/auth.js', () => ({ AuthManager: authModule.AuthManager }));
vi.mock('axios', () => axiosModule);

const baseConfig: EnvironmentConfig = {
    baseUrl: 'https://controller.local',
    clientId: 'client-id',
    clientSecret: 'secret',
    omadacId: 'omadac',
    siteId: 'default-site',
    strictSsl: true,
    requestTimeout: 5000,
    logLevel: 'info',
    logFormat: 'plain',
    useHttp: false,
    httpTransport: 'stream',
    httpEnableHealthcheck: true,
    httpAllowCors: true,
    httpNgrokEnabled: false,
};

describe('OmadaClient aggregator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes dependencies and proxies methods', async () => {
        const { OmadaClient } = await import('../../src/omadaClient/index.js');
        const client = new OmadaClient(baseConfig);

        expect(axiosModule.default.create).toHaveBeenCalledWith(expect.objectContaining({ baseURL: 'https://controller.local' }));
        expect(authModule.AuthManager).toHaveBeenCalledWith(axiosModule.axiosInstance, 'client-id', 'secret', 'omadac');
        expect(requestModule.RequestHandler).toHaveBeenCalled();
        expect(siteModule.SiteOperations).toHaveBeenCalledWith(requestModule.instance, expect.any(Function), 'default-site');

        await expect(client.listSites()).resolves.toEqual([{ id: 'site-1' }]);
        await expect(client.listDevices('s1')).resolves.toEqual([{ id: 'device-1' }]);
        await expect(client.getDevice('dev', 's1')).resolves.toEqual({ id: 'device-1' });
        await expect(client.getSwitchStackDetail('stack', 's1')).resolves.toEqual({ id: 'stack' });
        await expect(client.searchDevices('switch')).resolves.toEqual([{ id: 'device-2' }]);
        await expect(client.listDevicesStats({ page: 1, pageSize: 10 })).resolves.toEqual({ totalRows: 0 });
        await expect(client.listClients('s1')).resolves.toEqual([{ id: 'client-1' }]);
        await expect(client.getClient('cli', 's1')).resolves.toEqual({ id: 'client-1' });
        await expect(client.listMostActiveClients('s1')).resolves.toEqual([{ id: 'active-1' }]);
        await expect(client.listClientsActivity()).resolves.toEqual([{ id: 'activity' }]);
        await expect(client.listClientsPastConnections({} as never)).resolves.toEqual([{ id: 'past' }]);
        await expect(client.getThreatList({} as never)).resolves.toEqual({ data: [] });
        await expect(client.getInternetInfo('s1')).resolves.toEqual({ wan: 'ok' });
        await expect(client.getPortForwardingStatus('User')).resolves.toEqual({ totalRows: 1 });
        await expect(client.getLanNetworkList('s1')).resolves.toEqual([{ id: 'lan' }]);
        await expect(client.getLanProfileList('s1')).resolves.toEqual([{ id: 'profile' }]);
        await expect(client.getWlanGroupList('s1')).resolves.toEqual([{ id: 'wlan' }]);
        await expect(client.getSsidList('wlan', 's1')).resolves.toEqual([{ id: 'ssid' }]);
        await expect(client.getSsidDetail('wlan', 'ssid', 's1')).resolves.toEqual({ id: 'ssid-detail' });
        await expect(client.getFirewallSetting('s1')).resolves.toEqual({ rules: [] });
        await expect(client.callApi({ url: '/path' })).resolves.toEqual({ success: true });

        expect(siteModule.instance.listSites).toHaveBeenCalled();
        expect(deviceModule.instance.listDevices).toHaveBeenCalledWith('s1', undefined);
        expect(clientModule.instance.listClients).toHaveBeenCalledWith('s1', undefined);
        expect(networkModule.instance.getPortForwardingStatus).toHaveBeenCalledWith('User', undefined, 1, 10, undefined);
        expect(requestModule.instance.request).toHaveBeenCalledWith({ url: '/path' }, true, undefined);
    });
});
