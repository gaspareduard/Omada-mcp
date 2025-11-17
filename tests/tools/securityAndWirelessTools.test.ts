import { describe, expect, it, vi } from 'vitest';

describe('Security and Wireless Tools', () => {
    describe('registerGetPortForwardingStatusTool', () => {
        it('should register the tool and handle User type', async () => {
            const { registerGetPortForwardingStatusTool } = await import('../../src/tools/getPortForwardingStatus.js');

            const mockRules = {
                data: [{ name: 'Rule 1', externalPort: 8080, internalPort: 80 }],
                totalCount: 1,
            };

            const mockClient = {
                getPortForwardingStatus: vi.fn().mockResolvedValue(mockRules),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) => handler({ type: 'User', siteId: 'test-site', page: 1, pageSize: 10 }, {})),
            };

            registerGetPortForwardingStatusTool(mockServer as never, mockClient as never);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'getPortForwardingStatus',
                expect.objectContaining({
                    description: expect.any(String),
                }),
                expect.any(Function)
            );
            expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('User', 'test-site', 1, 10);
        });

        it('should handle UPnP type', async () => {
            const { registerGetPortForwardingStatusTool } = await import('../../src/tools/getPortForwardingStatus.js');

            const mockRules = {
                data: [{ name: 'UPnP Rule', externalPort: 3389, internalPort: 3389 }],
                totalCount: 1,
            };

            const mockClient = {
                getPortForwardingStatus: vi.fn().mockResolvedValue(mockRules),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) => handler({ type: 'UPnP', page: 1, pageSize: 10 }, {})),
            };

            registerGetPortForwardingStatusTool(mockServer as never, mockClient as never);
            expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('UPnP', undefined, 1, 10);
        });
    });

    describe('registerGetSsidDetailTool', () => {
        it('should register the tool and handle successful response', async () => {
            const { registerGetSsidDetailTool } = await import('../../src/tools/getSsidDetail.js');

            const mockSsidDetail = {
                ssidId: 'ssid1',
                name: 'Corporate WiFi',
                security: 'wpa2-psk',
                encryption: 'aes',
            };

            const mockClient = {
                getSsidDetail: vi.fn().mockResolvedValue(mockSsidDetail),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) => handler({ wlanId: 'wlan1', ssidId: 'ssid1', siteId: 'test-site' }, {})),
            };

            registerGetSsidDetailTool(mockServer as never, mockClient as never);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'getSsidDetail',
                expect.objectContaining({
                    description: expect.any(String),
                }),
                expect.any(Function)
            );
            expect(mockClient.getSsidDetail).toHaveBeenCalledWith('wlan1', 'ssid1', 'test-site');
        });
    });

    describe('registerGetSsidListTool', () => {
        it('should register the tool and handle successful response', async () => {
            const { registerGetSsidListTool } = await import('../../src/tools/getSsidList.js');

            const mockSsids = [
                { ssidId: 'ssid1', name: 'Corporate' },
                { ssidId: 'ssid2', name: 'Guest' },
            ];

            const mockClient = {
                getSsidList: vi.fn().mockResolvedValue(mockSsids),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) => handler({ wlanId: 'wlan1', siteId: 'test-site' }, {})),
            };

            registerGetSsidListTool(mockServer as never, mockClient as never);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'getSsidList',
                expect.objectContaining({
                    description: expect.any(String),
                }),
                expect.any(Function)
            );
            expect(mockClient.getSsidList).toHaveBeenCalledWith('wlan1', 'test-site');
        });
    });

    describe('registerGetThreatListTool', () => {
        it('should register the tool with full arguments', async () => {
            const { registerGetThreatListTool } = await import('../../src/tools/getThreatList.js');

            const mockThreats = {
                data: [
                    {
                        threatId: 'threat1',
                        severity: 0,
                        sourceIp: '192.168.1.100',
                        destIp: '10.0.0.1',
                        classification: 'Malware',
                    },
                ],
                totalCount: 1,
            };

            const mockClient = {
                getThreatList: vi.fn().mockResolvedValue(mockThreats),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) =>
                    handler(
                        {
                            siteList: 'site1,site2',
                            archived: false,
                            page: 1,
                            pageSize: 20,
                            startTime: 1682000000,
                            endTime: 1682100000,
                            severity: 0,
                            sortTime: 'desc',
                            searchKey: 'malware',
                        },
                        {}
                    )
                ),
            };

            registerGetThreatListTool(mockServer as never, mockClient as never);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'getThreatList',
                expect.objectContaining({
                    description: expect.any(String),
                }),
                expect.any(Function)
            );
            expect(mockClient.getThreatList).toHaveBeenCalledWith({
                siteList: 'site1,site2',
                archived: false,
                page: 1,
                pageSize: 20,
                startTime: 1682000000,
                endTime: 1682100000,
                severity: 0,
                sortTime: 'desc',
                searchKey: 'malware',
            });
        });

        it('should handle minimal arguments', async () => {
            const { registerGetThreatListTool } = await import('../../src/tools/getThreatList.js');

            const mockThreats = {
                data: [],
                totalCount: 0,
            };

            const mockClient = {
                getThreatList: vi.fn().mockResolvedValue(mockThreats),
            };

            const mockServer = {
                registerTool: vi.fn((_, _schema, handler) =>
                    handler(
                        {
                            archived: true,
                            page: 1,
                            pageSize: 10,
                            startTime: 1682000000,
                            endTime: 1682100000,
                        },
                        {}
                    )
                ),
            };

            registerGetThreatListTool(mockServer as never, mockClient as never);
            expect(mockClient.getThreatList).toHaveBeenCalledWith({
                siteList: undefined,
                archived: true,
                page: 1,
                pageSize: 10,
                startTime: 1682000000,
                endTime: 1682100000,
                severity: undefined,
                sortTime: undefined,
                searchKey: undefined,
            });
        });
    });
});
