import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerCreateDhcpReservationTool } from '../../src/tools/createDhcpReservation.js';

describe('tools/createDhcpReservation', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'net-1', name: 'Trusted', gatewaySubnet: '192.168.10.1/24' }]),
            getDhcpReservationGrid: vi.fn().mockResolvedValue({ data: [] }),
            createDhcpReservation: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('pages through all DHCP reservations before checking for conflicts', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid)
            .mockResolvedValueOnce({
                data: Array.from({ length: 1000 }, (_, index) => ({ mac: `00:00:00:00:00:${String(index).padStart(2, '0')}` })),
            } as never)
            .mockResolvedValueOnce({ data: [] } as never);

        registerCreateDhcpReservationTool(mockServer, mockClient);

        await toolHandler(
            {
                mac: 'AA:BB:CC:DD:EE:11',
                netId: 'net-1',
                status: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient.getDhcpReservationGrid).toHaveBeenNthCalledWith(1, 1, 1000, undefined, undefined);
        expect(mockClient.getDhcpReservationGrid).toHaveBeenNthCalledWith(2, 2, 1000, undefined, undefined);
    });

    it('returns a dry-run summary without applying the reservation', async () => {
        registerCreateDhcpReservationTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                mac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.50',
                dryRun: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient.createDhcpReservation).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'create-dhcp-reservation',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned DHCP reservation for AA:BB:CC:DD:EE:FF.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                network: { id: 'net-1', name: 'Trusted', gatewaySubnet: '192.168.10.1/24' },
                                plannedReservation: {
                                    mac: 'AA:BB:CC:DD:EE:FF',
                                    netId: 'net-1',
                                    status: true,
                                    ip: '192.168.10.50',
                                },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('throws when a reservation already exists for the MAC address', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid).mockResolvedValue({
            data: [{ mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40' }],
        } as never);

        registerCreateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    mac: 'AA:BB:CC:DD:EE:FF',
                    netId: 'net-1',
                    status: true,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('A DHCP reservation for AA:BB:CC:DD:EE:FF already exists. Use updateDhcpReservation instead.');
    });

    it('throws when the requested IP is already reserved unless confirmConflict is true', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid).mockResolvedValue({
            data: [{ mac: '11:22:33:44:55:66', ip: '192.168.10.70' }],
        } as never);

        registerCreateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    mac: 'AA:BB:CC:DD:EE:11',
                    netId: 'net-1',
                    status: true,
                    ip: '192.168.10.70',
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow(
            'IP 192.168.10.70 is already reserved by 11:22:33:44:55:66. Set confirmConflict to true only if you intend to override the controller conflict warning.'
        );
    });

    it('allows a conflicting IP when confirmConflict is true', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid).mockResolvedValue({
            data: [{ mac: '11:22:33:44:55:66', ip: '192.168.10.70' }],
        } as never);

        registerCreateDhcpReservationTool(mockServer, mockClient);

        await toolHandler(
            {
                mac: 'AA:BB:CC:DD:EE:11',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.70',
                confirmConflict: true,
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.createDhcpReservation).toHaveBeenCalledWith(
            {
                mac: 'AA:BB:CC:DD:EE:11',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.70',
                description: undefined,
                confirmConflict: true,
                options: undefined,
            },
            'site-1',
            undefined
        );
    });

    it('calls the controller when validation succeeds', async () => {
        registerCreateDhcpReservationTool(mockServer, mockClient);

        await toolHandler(
            {
                mac: 'AA:BB:CC:DD:EE:11',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.70',
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.createDhcpReservation).toHaveBeenCalledWith(
            {
                mac: 'AA:BB:CC:DD:EE:11',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.70',
                description: undefined,
                confirmConflict: undefined,
                options: undefined,
            },
            'site-1',
            undefined
        );
    });

    it('throws when the target LAN network does not exist', async () => {
        vi.mocked(mockClient.getLanNetworkList).mockResolvedValue([] as never);

        registerCreateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    mac: 'AA:BB:CC:DD:EE:11',
                    netId: 'missing-net',
                    status: true,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('LAN network missing-net was not found in the selected site.');
    });

    it('throws when the requested IP is outside the selected subnet', async () => {
        registerCreateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    mac: 'AA:BB:CC:DD:EE:11',
                    netId: 'net-1',
                    status: true,
                    ip: '192.168.50.70',
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('IP 192.168.50.70 is outside the selected LAN network subnet 192.168.10.1/24.');
    });

    it('throws when the requested IP matches the gateway address', async () => {
        registerCreateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    mac: 'AA:BB:CC:DD:EE:11',
                    netId: 'net-1',
                    status: true,
                    ip: '192.168.10.1',
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('IP 192.168.10.1 matches the LAN gateway address for Trusted. Choose a different reservation address.');
    });
});
