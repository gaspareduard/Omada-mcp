import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import {
    buildEffectiveReservation,
    dhcpReservationPayloadSchema,
    findLanNetworkById,
    findReservationByIp,
    findReservationByMac,
    getAllDhcpReservations,
    validateReservationIpAgainstNetwork,
} from './dhcpReservationShared.js';

interface UpdateDhcpReservationPayload {
    netId: string;
    status: boolean;
    ip?: string;
    description?: string;
    confirmConflict?: boolean;
    options?: unknown[];
}

export function registerUpdateDhcpReservationTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = siteInputSchema.extend({
        reservationMac: deviceMacSchema.describe('MAC address of the existing DHCP reservation to update.'),
        netId: dhcpReservationPayloadSchema.shape.netId,
        status: dhcpReservationPayloadSchema.shape.status,
        ip: dhcpReservationPayloadSchema.shape.ip,
        description: dhcpReservationPayloadSchema.shape.description,
        confirmConflict: dhcpReservationPayloadSchema.shape.confirmConflict,
        options: dhcpReservationPayloadSchema.shape.options,
        dryRun: z.boolean().optional().default(false).describe('If true, validate and summarize the planned change without applying it.'),
    });

    server.registerTool(
        'updateDhcpReservation',
        {
            description: 'Update an existing DHCP reservation after validating the target LAN network and reservation IP.',
            inputSchema: inputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapMutationToolHandler(
            'updateDhcpReservation',
            ({ reservationMac, siteId }, result, mode) => ({
                action: 'update-dhcp-reservation',
                target: reservationMac,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'applied',
                summary:
                    mode === 'dry-run'
                        ? `Planned DHCP reservation update for ${reservationMac}.`
                        : `DHCP reservation update requested for ${reservationMac}.`,
                result,
            }),
            async ({ reservationMac, netId, status, ip, description, confirmConflict, options, dryRun, siteId, customHeaders }) => {
                const reservationPayload: UpdateDhcpReservationPayload = {
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

                const existing = findReservationByMac(existingReservations, reservationMac);
                if (!existing) {
                    throw new Error(`No DHCP reservation exists for ${reservationMac}.`);
                }

                const effectiveReservation = buildEffectiveReservation(existing, {
                    mac: reservationMac,
                    ...reservationPayload,
                });

                validateReservationIpAgainstNetwork(effectiveReservation.ip, targetNetwork);

                if (effectiveReservation.ip) {
                    const conflictingReservation = findReservationByIp(existingReservations, effectiveReservation.ip, reservationMac);
                    if (conflictingReservation && !effectiveReservation.confirmConflict) {
                        throw new Error(
                            `IP ${effectiveReservation.ip} is already reserved by ${conflictingReservation.mac}. Set confirmConflict to true only if you intend to override the controller conflict warning.`
                        );
                    }
                }

                if (dryRun) {
                    return {
                        accepted: true,
                        dryRun: true,
                        before: existing,
                        network: targetNetwork,
                        plannedReservation: effectiveReservation,
                    };
                }

                return await client.updateDhcpReservation(reservationMac, effectiveReservation, siteId, customHeaders);
            }
        )
    );
}
