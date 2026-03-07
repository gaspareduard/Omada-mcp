import { describe, expect, it, vi } from 'vitest';

describe('Network Configuration Tools', () => {
    describe('registerGetLanNetworkListTool', () => {
        it('should register the tool and handle successful response', async () => {
            const { registerGetLanNetworkListTool } = await import('../../src/tools/getLanNetworkList.js');

            const mockLanNetworks = [
                { networkId: 'net1', vlanId: 10, ipAddr: '192.168.10.1', netmask: '255.255.255.0' },
                { networkId: 'net2', vlanId: 20, ipAddr: '192.168.20.1', netmask: '255.255.255.0' },
            ];

            const mockClient = {
                getLanNetworkList: vi.fn().mockResolvedValue(mockLanNetworks),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) => handler({ siteId: 'test-site' }, {})),
            };

            registerGetLanNetworkListTool(mockServer as never, mockClient as never);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'getLanNetworkList',
                expect.objectContaining({
                    description: expect.any(String),
                }),
                expect.any(Function)
            );
            expect(mockClient.getLanNetworkList).toHaveBeenCalledWith('test-site', undefined);
        });
    });

    describe('registerGetLanProfileListTool', () => {
        it('should register the tool and handle successful response', async () => {
            const { registerGetLanProfileListTool } = await import('../../src/tools/getLanProfileList.js');

            const mockLanProfiles = [
                { profileId: 'prof1', name: 'Corporate', vlanId: 10 },
                { profileId: 'prof2', name: 'Guest', vlanId: 20 },
            ];

            const mockClient = {
                getLanProfileList: vi.fn().mockResolvedValue(mockLanProfiles),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) => handler({ siteId: 'test-site' }, {})),
            };

            registerGetLanProfileListTool(mockServer as never, mockClient as never);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'getLanProfileList',
                expect.objectContaining({
                    description: expect.any(String),
                }),
                expect.any(Function)
            );
            expect(mockClient.getLanProfileList).toHaveBeenCalledWith('test-site', undefined);
        });
    });

    describe('registerGetWlanGroupListTool', () => {
        it('should register the tool and handle successful response', async () => {
            const { registerGetWlanGroupListTool } = await import('../../src/tools/getWlanGroupList.js');

            const mockWlanGroups = [
                { wlanId: 'wlan1', name: 'Corporate WiFi' },
                { wlanId: 'wlan2', name: 'Guest WiFi' },
            ];

            const mockClient = {
                getWlanGroupList: vi.fn().mockResolvedValue(mockWlanGroups),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) => handler({ siteId: 'test-site' }, {})),
            };

            registerGetWlanGroupListTool(mockServer as never, mockClient as never);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'getWlanGroupList',
                expect.objectContaining({
                    description: expect.any(String),
                }),
                expect.any(Function)
            );
            expect(mockClient.getWlanGroupList).toHaveBeenCalledWith('test-site', undefined);
        });
    });

    describe('registerGetSwitchStackDetailTool', () => {
        it('should register the tool and handle successful response', async () => {
            const { registerGetSwitchStackDetailTool } = await import('../../src/tools/getSwitchStackDetail.js');

            const mockStackDetail = {
                stackId: 'stack1',
                name: 'Building A Stack',
                memberCount: 3,
            };

            const mockClient = {
                getSwitchStackDetail: vi.fn().mockResolvedValue(mockStackDetail),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) => handler({ stackId: 'stack1', siteId: 'test-site' }, {})),
            };

            registerGetSwitchStackDetailTool(mockServer as never, mockClient as never);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'getSwitchStackDetail',
                expect.objectContaining({
                    description: expect.any(String),
                }),
                expect.any(Function)
            );
            expect(mockClient.getSwitchStackDetail).toHaveBeenCalledWith('stack1', 'test-site', undefined);
        });
    });
});

describe('registerGetGridStaticRoutingTool', () => {
    it('should register the tool and handle successful response', async () => {
        const { registerGetGridStaticRoutingTool } = await import('../../src/tools/getGridStaticRouting.js');

        const mockResult = { data: [{ id: 'route1', destination: '10.0.0.0/8', gateway: '192.168.1.1' }], totalRows: 1 };
        const mockClient = { getGridStaticRouting: vi.fn().mockResolvedValue(mockResult) };
        const mockServer = { registerTool: vi.fn((_, _schema, handler) => handler({ page: 1, pageSize: 10, siteId: 'site1' }, {})) };

        registerGetGridStaticRoutingTool(mockServer as never, mockClient as never);

        expect(mockServer.registerTool).toHaveBeenCalledWith(
            'getGridStaticRouting',
            expect.objectContaining({ description: expect.any(String) }),
            expect.any(Function)
        );
        expect(mockClient.getGridStaticRouting).toHaveBeenCalledWith(1, 10, 'site1', undefined);
    });
});

describe('registerGetPortForwardingListTool', () => {
    it('should register the tool and handle successful response', async () => {
        const { registerGetPortForwardingListTool } = await import('../../src/tools/getPortForwardingList.js');

        const mockResult = { data: [{ id: 'fwd1', externalPort: 80, internalPort: 8080, internalIp: '192.168.1.10' }], totalRows: 1 };
        const mockClient = { getPortForwardingListPage: vi.fn().mockResolvedValue(mockResult) };
        const mockServer = { registerTool: vi.fn((_, _schema, handler) => handler({ page: 1, pageSize: 10, siteId: 'site1' }, {})) };

        registerGetPortForwardingListTool(mockServer as never, mockClient as never);

        expect(mockServer.registerTool).toHaveBeenCalledWith(
            'getPortForwardingList',
            expect.objectContaining({ description: expect.any(String) }),
            expect.any(Function)
        );
        expect(mockClient.getPortForwardingListPage).toHaveBeenCalledWith(1, 10, 'site1', undefined);
    });
});

describe('registerGetBandwidthCtrlTool', () => {
    it('should register the tool and handle successful response', async () => {
        const { registerGetBandwidthCtrlTool } = await import('../../src/tools/getBandwidthCtrl.js');

        const mockConfig = { enable: true, upBandwidth: 100, downBandwidth: 100 };
        const mockClient = { getBandwidthControl: vi.fn().mockResolvedValue(mockConfig) };
        const mockServer = { registerTool: vi.fn((_, _schema, handler) => handler({ siteId: 'site1' }, {})) };

        registerGetBandwidthCtrlTool(mockServer as never, mockClient as never);

        expect(mockServer.registerTool).toHaveBeenCalledWith(
            'getBandwidthCtrl',
            expect.objectContaining({ description: expect.any(String) }),
            expect.any(Function)
        );
        expect(mockClient.getBandwidthControl).toHaveBeenCalledWith('site1', undefined);
    });
});
