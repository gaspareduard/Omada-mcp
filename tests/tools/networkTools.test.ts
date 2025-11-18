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
            expect(mockClient.getLanNetworkList).toHaveBeenCalledWith('test-site');
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
            expect(mockClient.getLanProfileList).toHaveBeenCalledWith('test-site');
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
            expect(mockClient.getWlanGroupList).toHaveBeenCalledWith('test-site');
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
            expect(mockClient.getSwitchStackDetail).toHaveBeenCalledWith('stack1', 'test-site');
        });
    });
});
