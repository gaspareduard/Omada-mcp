import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateDhcpReservationTool } from '../../src/tools/updateDhcpReservation.js';

describe('tools/updateDhcpReservation', () => {
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
            getDhcpReservationGrid: vi.fn().mockResolvedValue({ data: [{ mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40', status: true }] }),
            updateDhcpReservation: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary for a valid update', async () => {
        registerUpdateDhcpReservationTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                reservationMac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: false,
                ip: '192.168.10.60',
                dryRun: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient.updateDhcpReservation).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'update-dhcp-reservation',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned DHCP reservation update for AA:BB:CC:DD:EE:FF.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: { mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40', status: true },
                                network: { id: 'net-1', name: 'Trusted', gatewaySubnet: '192.168.10.1/24' },
                                plannedReservation: {
                                    mac: 'AA:BB:CC:DD:EE:FF',
                                    netId: 'net-1',
                                    status: false,
                                    ip: '192.168.10.60',
                                    description: undefined,
                                    confirmConflict: false,
                                    options: undefined,
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

    it('throws when the reservation does not exist', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid).mockResolvedValue({ data: [] } as never);

        registerUpdateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    reservationMac: 'AA:BB:CC:DD:EE:FF',
                    netId: 'net-1',
                    status: true,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('No DHCP reservation exists for AA:BB:CC:DD:EE:FF.');
    });

    it('calls the controller when validation succeeds', async () => {
        registerUpdateDhcpReservationTool(mockServer, mockClient);

        await toolHandler(
            {
                reservationMac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: true,
                description: 'Reserved printer',
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.updateDhcpReservation).toHaveBeenCalledWith(
            'AA:BB:CC:DD:EE:FF',
            {
                mac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.40',
                description: 'Reserved printer',
                confirmConflict: false,
                options: undefined,
            },
            'site-1',
            undefined
        );
    });

    it('throws when the target LAN network does not exist', async () => {
        vi.mocked(mockClient.getLanNetworkList).mockResolvedValue([] as never);

        registerUpdateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    reservationMac: 'AA:BB:CC:DD:EE:FF',
                    netId: 'missing-net',
                    status: true,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('LAN network missing-net was not found in the selected site.');
    });

    it('validates the effective IP when moving a reservation to another network without overriding ip', async () => {
        vi.mocked(mockClient.getLanNetworkList).mockResolvedValue([
            { id: 'net-1', name: 'Trusted', gatewaySubnet: '192.168.10.1/24' },
            { id: 'net-2', name: 'Guests', gatewaySubnet: '192.168.40.1/24' },
        ] as never);

        registerUpdateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    reservationMac: 'AA:BB:CC:DD:EE:FF',
                    netId: 'net-2',
                    status: true,
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('IP 192.168.10.40 is outside the selected LAN network subnet 192.168.40.1/24.');
    });

    it('throws when the effective IP conflicts with another reservation', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid).mockResolvedValue({
            data: [
                { mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40', status: true },
                { mac: '11:22:33:44:55:66', ip: '192.168.10.99', status: true },
            ],
        } as never);

        registerUpdateDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    reservationMac: 'AA:BB:CC:DD:EE:FF',
                    netId: 'net-1',
                    status: true,
                    ip: '192.168.10.99',
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow(
            'IP 192.168.10.99 is already reserved by 11:22:33:44:55:66. Set confirmConflict to true only if you intend to override the controller conflict warning.'
        );
    });

    it('allows a conflicting effective IP when confirmConflict is true', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid).mockResolvedValue({
            data: [
                { mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40', status: true },
                { mac: '11:22:33:44:55:66', ip: '192.168.10.99', status: true },
            ],
        } as never);

        registerUpdateDhcpReservationTool(mockServer, mockClient);

        await toolHandler(
            {
                reservationMac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.99',
                confirmConflict: true,
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.updateDhcpReservation).toHaveBeenCalledWith(
            'AA:BB:CC:DD:EE:FF',
            {
                mac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: true,
                ip: '192.168.10.99',
                description: undefined,
                confirmConflict: true,
                options: undefined,
            },
            'site-1',
            undefined
        );
    });

    it('pages through all reservations before resolving the target reservation', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid)
            .mockResolvedValueOnce({
                data: Array.from({ length: 1000 }, (_, index) => ({ mac: `00:00:00:00:00:${String(index).padStart(2, '0')}` })),
            } as never)
            .mockResolvedValueOnce({ data: [{ mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40', status: true }] } as never);

        registerUpdateDhcpReservationTool(mockServer, mockClient);

        await toolHandler(
            {
                reservationMac: 'AA:BB:CC:DD:EE:FF',
                netId: 'net-1',
                status: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient.getDhcpReservationGrid).toHaveBeenNthCalledWith(1, 1, 1000, undefined, undefined);
        expect(mockClient.getDhcpReservationGrid).toHaveBeenNthCalledWith(2, 2, 1000, undefined, undefined);
    });
});
