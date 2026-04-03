import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import {
    type DhcpReservationPayload,
    dhcpReservationPayloadSchema,
    findLanNetworkById,
    findReservationByIp,
    findReservationByMac,
    getAllDhcpReservations,
    validateReservationIpAgainstNetwork,
} from './dhcpReservationShared.js';

export function registerCreateDhcpReservationTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        ...dhcpReservationPayloadSchema.shape,
        dryRun: z.boolean().optional().default(false).describe('If true, validate and summarize the planned reservation without applying it.'),
    });

    server.registerTool(
        'createDhcpReservation',
        {
            description: 'Create a DHCP reservation for a specific LAN network after validating the selected network and reservation IP.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'createDhcpReservation',
            ({ mac, siteId }, result, mode) => ({
                action: 'create-dhcp-reservation',
                target: mac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary: mode === 'dry-run' ? `Planned DHCP reservation for ${mac}.` : `DHCP reservation requested for ${mac}.`,
                result,
            }),
            async ({ mac, netId, status, ip, description, confirmConflict, options, dryRun, siteId, customHeaders }) => {
                const reservationPayload: DhcpReservationPayload = {
                    mac,
                    netId,
                    status,
                    ip,
                    description,
                    confirmConflict,
                    options,
                };
                const [lanNetworks, existingReservations] = await Promise.all([
                    client.getLanNetworkList(siteId, customHeaders),
                    getAllDhcpReservations(client, siteId, customHeaders),
                ]);

                const targetNetwork = findLanNetworkById(lanNetworks, reservationPayload.netId);
                if (!targetNetwork) {
                    throw new Error(`LAN network ${reservationPayload.netId} was not found in the selected site.`);
                }

                validateReservationIpAgainstNetwork(reservationPayload.ip, targetNetwork);

                const existing = findReservationByMac(existingReservations, reservationPayload.mac);
                if (existing) {
                    throw new Error(`A DHCP reservation for ${reservationPayload.mac} already exists. Use updateDhcpReservation instead.`);
                }

                if (reservationPayload.ip) {
                    const conflictingReservation = findReservationByIp(existingReservations, reservationPayload.ip);
                    if (conflictingReservation && !reservationPayload.confirmConflict) {
                        throw new Error(
                            `IP ${reservationPayload.ip} is already reserved by ${conflictingReservation.mac}. Set confirmConflict to true only if you intend to override the controller conflict warning.`
                        );
                    }
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        network: targetNetwork,
                        plannedReservation: reservationPayload,
                    };
                }

                return await client.createDhcpReservation(reservationPayload, siteId, customHeaders);
            }
        )
    );
}
