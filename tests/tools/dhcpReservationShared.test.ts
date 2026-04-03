import { describe, expect, it, vi } from 'vitest';

import {
    buildEffectiveReservation,
    extractGridRecords,
    findLanNetworkById,
    findReservationByIp,
    findReservationByMac,
    getAllDhcpReservations,
    validateReservationIpAgainstNetwork,
} from '../../src/tools/dhcpReservationShared.js';

describe('tools/dhcpReservationShared', () => {
    it('extractGridRecords returns only object entries from data', () => {
        expect(extractGridRecords({ data: [{ mac: 'AA' }, null, 'bad'] })).toEqual([{ mac: 'AA' }]);
        expect(extractGridRecords(undefined)).toEqual([]);
    });

    it('findReservationByMac matches MAC addresses across separators', () => {
        const grid = {
            data: [{ mac: 'AA-BB-CC-DD-EE-FF', ip: '192.168.10.20' }],
        };

        expect(findReservationByMac(grid, 'AA:BB:CC:DD:EE:FF')).toEqual({ mac: 'AA-BB-CC-DD-EE-FF', ip: '192.168.10.20' });
        expect(findReservationByMac(grid, '11:22:33:44:55:66')).toBeUndefined();
    });

    it('findReservationByIp matches IP addresses and supports excluding the current MAC', () => {
        const grid = {
            data: [
                { mac: 'AA-BB-CC-DD-EE-FF', ip: '192.168.10.20' },
                { mac: '11-22-33-44-55-66', ip: '192.168.10.30' },
            ],
        };

        expect(findReservationByIp(grid, '192.168.10.20')).toEqual({ mac: 'AA-BB-CC-DD-EE-FF', ip: '192.168.10.20' });
        expect(findReservationByIp(grid, '192.168.10.20', 'AA:BB:CC:DD:EE:FF')).toBeUndefined();
        expect(findReservationByIp(grid, '192.168.10.40')).toBeUndefined();
    });

    it('findLanNetworkById returns the matching LAN network', () => {
        const networks = [
            { id: 'net-1', name: 'Trusted', gatewaySubnet: '192.168.10.1/24' },
            { id: 'net-2', name: 'IoT', gatewaySubnet: '192.168.50.1/24' },
        ];

        expect(findLanNetworkById(networks, 'net-2')).toEqual({ id: 'net-2', name: 'IoT', gatewaySubnet: '192.168.50.1/24' });
        expect(findLanNetworkById(networks, 'missing')).toBeUndefined();
    });

    it('buildEffectiveReservation merges updates over the existing reservation', () => {
        expect(
            buildEffectiveReservation(
                {
                    mac: 'AA:BB:CC:DD:EE:FF',
                    netId: 'net-1',
                    status: true,
                    ip: '192.168.10.40',
                    description: 'Old entry',
                },
                {
                    netId: 'net-2',
                    description: 'New entry',
                }
            )
        ).toEqual({
            mac: 'AA:BB:CC:DD:EE:FF',
            netId: 'net-2',
            status: true,
            ip: '192.168.10.40',
            description: 'New entry',
            confirmConflict: false,
            options: undefined,
        });
    });

    it('getAllDhcpReservations pages until a short page is returned', async () => {
        const client = {
            getDhcpReservationGrid: vi
                .fn()
                .mockResolvedValueOnce({
                    data: Array.from({ length: 1000 }, (_, index) => ({ mac: `AA:BB:CC:DD:EE:${String(index).padStart(2, '0')}` })),
                })
                .mockResolvedValueOnce({ data: [{ mac: '11:22:33:44:55:66', ip: '192.168.10.20' }] }),
        };

        const result = await getAllDhcpReservations(client as never, 'site-123');

        expect(client.getDhcpReservationGrid).toHaveBeenNthCalledWith(1, 1, 1000, 'site-123', undefined);
        expect(client.getDhcpReservationGrid).toHaveBeenNthCalledWith(2, 2, 1000, 'site-123', undefined);
        expect(result).toHaveLength(1001);
        expect(result.at(-1)).toEqual({ mac: '11:22:33:44:55:66', ip: '192.168.10.20' });
    });

    it('validates reservation IPs against the selected subnet', () => {
        expect(() => validateReservationIpAgainstNetwork(undefined, { gatewaySubnet: '192.168.10.1/24' })).not.toThrow();
        expect(() => validateReservationIpAgainstNetwork('192.168.10.55', { gatewaySubnet: '192.168.10.1/24', name: 'Trusted' })).not.toThrow();
        expect(() => validateReservationIpAgainstNetwork('192.168.50.55', { gatewaySubnet: '192.168.10.1/24' })).toThrow(
            'IP 192.168.50.55 is outside the selected LAN network subnet 192.168.10.1/24.'
        );
        expect(() => validateReservationIpAgainstNetwork('192.168.10.1', { gatewaySubnet: '192.168.10.1/24', name: 'Trusted' })).toThrow(
            'IP 192.168.10.1 matches the LAN gateway address for Trusted. Choose a different reservation address.'
        );
    });
});
