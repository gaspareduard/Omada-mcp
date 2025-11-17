import { type McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListClientsActivityTool } from '../../src/tools/listClientsActivity.js';
import { registerListClientsPastConnectionsTool } from '../../src/tools/listClientsPastConnections.js';
import { registerListDevicesStatsTool } from '../../src/tools/listDevicesStats.js';
import { registerListMostActiveClientsTool } from '../../src/tools/listMostActiveClients.js';

describe('tools - list operations', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let registeredHandlers: Map<string, Function>;
    let mockExtra: { sessionId: string };

    beforeEach(() => {
        registeredHandlers = new Map();
        mockExtra = { sessionId: 'test-session' };

        mockServer = {
            registerTool: vi.fn((name: string, _schema: unknown, handler: Function) => {
                registeredHandlers.set(name, handler);
            }),
        } as unknown as McpServer;

        mockClient = {
            listMostActiveClients: vi.fn(),
            listClientsActivity: vi.fn(),
            listClientsPastConnections: vi.fn(),
            listDevicesStats: vi.fn(),
        } as unknown as OmadaClient;

        vi.clearAllMocks();
    });

    describe('listMostActiveClients', () => {
        it('should register and execute successfully', async () => {
            const mockResult = [{ mac: '00:11:22:33:44:55', name: 'Client1', totalTraffic: 1000000 }];

            (mockClient.listMostActiveClients as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            registerListMostActiveClientsTool(mockServer, mockClient);

            const handler = registeredHandlers.get('listMostActiveClients');
            expect(handler).toBeDefined();

            const mockExtra = { sessionId: 'test-session' };
            const result = await handler!({ siteId: 'test-site' }, mockExtra, mockExtra);

            expect(mockClient.listMostActiveClients).toHaveBeenCalledWith('test-site');
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Failed to list clients');
            (mockClient.listMostActiveClients as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListMostActiveClientsTool(mockServer, mockClient);

            const handler = registeredHandlers.get('listMostActiveClients');
            await expect(handler!({ siteId: 'test-site' }, mockExtra)).rejects.toThrow('Failed to list clients');
        });
    });

    describe('listClientsActivity', () => {
        it('should register and execute successfully', async () => {
            const mockResult = [
                {
                    time: 1640000000,
                    newEapClientNum: 5,
                    newSwitchClientNum: 2,
                    activeEapClientNum: 10,
                    activeSwitchClientNum: 8,
                    disconnectEapClientNum: 1,
                    disconnectSwitchClientNum: 1,
                },
            ];

            (mockClient.listClientsActivity as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            registerListClientsActivityTool(mockServer, mockClient);

            const handler = registeredHandlers.get('listClientsActivity');
            expect(handler).toBeDefined();

            const result = await handler!({ siteId: 'test-site', start: 1640000000, end: 1640100000 }, mockExtra);

            expect(mockClient.listClientsActivity).toHaveBeenCalledWith({
                siteId: 'test-site',
                start: 1640000000,
                end: 1640100000,
            });
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
            });
        });

        it('should handle missing optional parameters', async () => {
            const mockResult: never[] = [];

            (mockClient.listClientsActivity as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            registerListClientsActivityTool(mockServer, mockClient);

            const handler = registeredHandlers.get('listClientsActivity');
            const result = await handler!({}, mockExtra);

            expect(mockClient.listClientsActivity).toHaveBeenCalledWith({});
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
            });
        });
    });

    describe('listClientsPastConnections', () => {
        it('should register and execute successfully', async () => {
            const mockResult = [
                {
                    mac: '00:11:22:33:44:55',
                    name: 'Client 1',
                    lastSeen: 1640000000000,
                    firstSeen: 1639990000000,
                },
            ];

            (mockClient.listClientsPastConnections as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            registerListClientsPastConnectionsTool(mockServer, mockClient);

            const handler = registeredHandlers.get('listClientsPastConnections');
            expect(handler).toBeDefined();

            const result = await handler!(
                {
                    page: 1,
                    pageSize: 50,
                    siteId: 'test-site',
                },
                mockExtra
            );

            expect(mockClient.listClientsPastConnections).toHaveBeenCalledWith({
                page: 1,
                pageSize: 50,
                siteId: 'test-site',
            });
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
            });
        });

        it('should handle all optional parameters', async () => {
            const mockResult: never[] = [];

            (mockClient.listClientsPastConnections as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            registerListClientsPastConnectionsTool(mockServer, mockClient);

            const handler = registeredHandlers.get('listClientsPastConnections');
            const result = await handler!(
                {
                    page: 2,
                    pageSize: 100,
                    siteId: 'test-site',
                    sortLastSeen: 'desc',
                    timeStart: 1640000000000,
                    timeEnd: 1640100000000,
                    guest: true,
                    searchKey: 'test',
                },
                mockExtra
            );

            expect(mockClient.listClientsPastConnections).toHaveBeenCalledWith({
                page: 2,
                pageSize: 100,
                siteId: 'test-site',
                sortLastSeen: 'desc',
                timeStart: 1640000000000,
                timeEnd: 1640100000000,
                guest: true,
                searchKey: 'test',
            });
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
            });
        });
    });

    describe('listDevicesStats', () => {
        it('should register and execute successfully with required parameters', async () => {
            const mockResult = {
                page: 1,
                pageSize: 50,
                totalRows: 1,
                data: [{ mac: '00:11:22:33:44:55', name: 'Device 1' }],
            };

            (mockClient.listDevicesStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            registerListDevicesStatsTool(mockServer, mockClient);

            const handler = registeredHandlers.get('listDevicesStats');
            expect(handler).toBeDefined();

            const result = await handler!(
                {
                    page: 1,
                    pageSize: 50,
                },
                mockExtra
            );

            expect(mockClient.listDevicesStats).toHaveBeenCalledWith({
                page: 1,
                pageSize: 50,
            });
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
            });
        });

        it('should handle all optional search and filter parameters', async () => {
            const mockResult = {
                page: 2,
                pageSize: 100,
                totalRows: 0,
                data: [],
            };

            (mockClient.listDevicesStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

            registerListDevicesStatsTool(mockServer, mockClient);

            const handler = registeredHandlers.get('listDevicesStats');
            const result = await handler!(
                {
                    page: 2,
                    pageSize: 100,
                    searchMacs: '00:11:22:33:44:55',
                    searchNames: 'Device 1',
                    searchModels: 'EAP650',
                    searchSns: 'SN001',
                    filterTag: 'building-a',
                    filterDeviceSeriesType: 'eap',
                },
                mockExtra
            );

            expect(mockClient.listDevicesStats).toHaveBeenCalledWith({
                page: 2,
                pageSize: 100,
                searchMacs: '00:11:22:33:44:55',
                searchNames: 'Device 1',
                searchModels: 'EAP650',
                searchSns: 'SN001',
                filterTag: 'building-a',
                filterDeviceSeriesType: 'eap',
            });
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
            });
        });
    });
});
