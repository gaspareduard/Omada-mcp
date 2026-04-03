import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { findReservationByMac, getAllDhcpReservations } from './dhcpReservationShared.js';

export function registerDeleteDhcpReservationTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        reservationMac: deviceMacSchema.describe('MAC address of the DHCP reservation to delete.'),
        dryRun: z.boolean().optional().default(false).describe('If true, validate and summarize the planned delete without applying it.'),
    });

    server.registerTool(
        'deleteDhcpReservation',
        {
            description: 'Delete an existing DHCP reservation by MAC address.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'deleteDhcpReservation',
            ({ reservationMac, siteId }, result, mode) => ({
                action: 'delete-dhcp-reservation',
                target: reservationMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned DHCP reservation deletion for ${reservationMac}.`
                        : `DHCP reservation deletion requested for ${reservationMac}.`,
                result,
            }),
            async ({ reservationMac, dryRun, siteId, customHeaders }) => {
                const existingReservations = await getAllDhcpReservations(client, siteId, customHeaders);
                const existing = findReservationByMac(existingReservations, reservationMac);
                if (!existing) {
                    throw new Error(`No DHCP reservation exists for ${reservationMac}.`);
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before: existing,
                    };
                }

                return await client.deleteDhcpReservation(reservationMac, siteId, customHeaders);
            }
        )
    );
}
