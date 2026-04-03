import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDeleteDhcpReservationTool } from '../../src/tools/deleteDhcpReservation.js';

describe('tools/deleteDhcpReservation', () => {
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
            getDhcpReservationGrid: vi.fn().mockResolvedValue({ data: [{ mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40', status: true }] }),
            deleteDhcpReservation: vi.fn().mockResolvedValue({ accepted: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary before deleting', async () => {
        registerDeleteDhcpReservationTool(mockServer, mockClient);

        const result = await toolHandler(
            {
                reservationMac: 'AA:BB:CC:DD:EE:FF',
                dryRun: true,
            },
            { sessionId: 's1' }
        );

        expect(mockClient.deleteDhcpReservation).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'delete-dhcp-reservation',
                            target: 'AA:BB:CC:DD:EE:FF',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned DHCP reservation deletion for AA:BB:CC:DD:EE:FF.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: { mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40', status: true },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('calls the controller when the reservation exists', async () => {
        registerDeleteDhcpReservationTool(mockServer, mockClient);

        await toolHandler(
            {
                reservationMac: 'AA:BB:CC:DD:EE:FF',
                siteId: 'site-1',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.deleteDhcpReservation).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
    });

    it('pages through reservations until the target is found', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid)
            .mockResolvedValueOnce({
                data: Array.from({ length: 1000 }, (_, index) => ({ mac: `00:00:00:00:00:${String(index).padStart(2, '0')}` })),
            } as never)
            .mockResolvedValueOnce({ data: [{ mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.10.40', status: true }] } as never);

        registerDeleteDhcpReservationTool(mockServer, mockClient);

        await toolHandler(
            {
                reservationMac: 'AA:BB:CC:DD:EE:FF',
            },
            { sessionId: 's1' }
        );

        expect(mockClient.getDhcpReservationGrid).toHaveBeenNthCalledWith(1, 1, 1000, undefined, undefined);
        expect(mockClient.getDhcpReservationGrid).toHaveBeenNthCalledWith(2, 2, 1000, undefined, undefined);
    });

    it('throws when the reservation does not exist', async () => {
        vi.mocked(mockClient.getDhcpReservationGrid).mockResolvedValue({ data: [] } as never);
        registerDeleteDhcpReservationTool(mockServer, mockClient);

        await expect(
            toolHandler(
                {
                    reservationMac: 'AA:BB:CC:DD:EE:FF',
                },
                { sessionId: 's1' }
            )
        ).rejects.toThrow('No DHCP reservation exists for AA:BB:CC:DD:EE:FF.');
    });
});
