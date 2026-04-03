import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema } from '../server/common.js';

export const aclIdSchema = z.string().trim().min(1, 'aclId is required.');

export const gatewayAclConfigModeSchema = z.object({
    mode: z
        .number()
        .int()
        .refine((value) => value === 0 || value === 1, 'mode must be 0 (through profiles) or 1 (custom).')
        .describe('Gateway ACL mode. 0 = through profiles, 1 = custom.'),
});

const protocolNumberSchema = z.number().int().nonnegative();

const gatewayAclDirectionSchema = z.object({
    lanToWan: z.boolean().optional(),
    lanToLan: z.boolean().optional(),
    wanInIds: z.array(z.string().trim().min(1)).optional(),
    vpnInIds: z.array(z.string().trim().min(1)).optional(),
});

const gatewayAclStatesSchema = z.object({
    stateNew: z.boolean().optional(),
    established: z.boolean().optional(),
    related: z.boolean().optional(),
    invalid: z.boolean().optional(),
});

export const gatewayAclPayloadSchema = z.object({
    description: z.string().trim().min(1).max(512),
    status: z.boolean(),
    policy: z
        .number()
        .int()
        .refine((value) => value === 0 || value === 1, 'policy must be 0 (drop) or 1 (allow).'),
    protocols: z.array(protocolNumberSchema).min(1, 'At least one protocol is required.'),
    sourceIds: z.array(z.string().trim().min(1)).min(1, 'At least one sourceId is required.'),
    destinationIds: z.array(z.string().trim().min(1)).optional(),
    syslog: z.boolean(),
    sourceType: z.number().int(),
    destinationType: z.number().int(),
    direction: gatewayAclDirectionSchema,
    stateMode: z
        .number()
        .int()
        .refine((value) => value === 0 || value === 1, 'stateMode must be 0 (auto) or 1 (manual).'),
    states: gatewayAclStatesSchema.optional(),
    timeRangeId: z.string().trim().min(1).optional(),
});

export const eapAclPayloadSchema = z.object({
    description: z.string().trim().min(1).max(512),
    status: z.boolean(),
    policy: z
        .number()
        .int()
        .refine((value) => value === 0 || value === 1, 'policy must be 0 (drop) or 1 (allow).'),
    protocols: z.array(protocolNumberSchema).min(1, 'At least one protocol is required.'),
    sourceIds: z.array(z.string().trim().min(1)).min(1, 'At least one sourceId is required.'),
    destinationIds: z.array(z.string().trim().min(1)).optional(),
    sourceType: z.number().int(),
    destinationType: z.number().int(),
});

export const createGatewayAclInputSchema = siteInputSchema.extend({
    payload: gatewayAclPayloadSchema.describe('Gateway ACL payload following the official Omada GatewayACLConfig schema.'),
    dryRun: z.boolean().optional().default(false),
});

export const updateGatewayAclInputSchema = siteInputSchema.extend({
    aclId: aclIdSchema,
    payload: gatewayAclPayloadSchema.describe('Gateway ACL payload following the official Omada GatewayACLConfig schema.'),
    dryRun: z.boolean().optional().default(false),
});

export const createEapAclInputSchema = siteInputSchema.extend({
    payload: eapAclPayloadSchema.describe('EAP ACL payload following the official Omada EapACLConfig schema.'),
    dryRun: z.boolean().optional().default(false),
});

export const updateEapAclInputSchema = siteInputSchema.extend({
    aclId: aclIdSchema,
    payload: eapAclPayloadSchema.describe('EAP ACL payload following the official Omada EapACLConfig schema.'),
    dryRun: z.boolean().optional().default(false),
});

export const deleteAclInputSchema = siteInputSchema.extend({
    aclId: aclIdSchema,
    dryRun: z.boolean().optional().default(false),
});

export const setAclConfigTypeInputSchema = siteInputSchema.extend({
    mode: gatewayAclConfigModeSchema.shape.mode,
    dryRun: z.boolean().optional().default(false),
});

interface AclRecord {
    id?: string;
    aclId?: string;
    description?: string;
}

export function getAclRecordId(record: Record<string, unknown>): string {
    return String((record['id'] as string | number | undefined) ?? (record['aclId'] as string | number | undefined) ?? '');
}

export function findAclById(value: unknown, aclId: string): AclRecord | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    return value.find((entry) => {
        if (typeof entry !== 'object' || entry === null) {
            return false;
        }

        const record = entry as Record<string, unknown>;
        return record.id === aclId || record.aclId === aclId;
    }) as AclRecord | undefined;
}

export function findCreatedAclByDescription(before: unknown, after: unknown, description: string): Record<string, unknown> | undefined {
    if (!Array.isArray(after)) {
        return undefined;
    }

    const beforeIds = new Set(
        Array.isArray(before)
            ? before
                  .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
                  .map((entry) => getAclRecordId(entry))
            : []
    );

    return after
        .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
        .find((entry) => !beforeIds.has(getAclRecordId(entry)) && entry['description'] === description);
}

function extractLanNetworkIds(value: unknown[]): Set<string> {
    return new Set(
        value
            .filter((entry): entry is { id?: string } => typeof entry === 'object' && entry !== null)
            .map((entry) => entry.id)
            .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    );
}

async function extractSsidIds(client: OmadaClient, siteId?: string, customHeaders?: Record<string, string>): Promise<Set<string>> {
    const ssidIds = new Set<string>();
    const wlanGroups = await client.getWlanGroupList(siteId, customHeaders);

    await Promise.all(
        wlanGroups.map(async (group) => {
            const wlanId = typeof group === 'object' && group !== null && 'wlanId' in group ? String(group.wlanId) : '';
            if (!wlanId) {
                return;
            }
            const ssids = await client.getSsidList(wlanId, siteId, customHeaders);
            for (const ssid of ssids) {
                const ssidId =
                    typeof ssid === 'object' && ssid !== null && 'id' in ssid
                        ? ssid.id
                        : typeof ssid === 'object' && ssid !== null && 'ssidId' in ssid
                          ? ssid.ssidId
                          : undefined;
                if (typeof ssidId === 'string' && ssidId.length > 0) {
                    ssidIds.add(ssidId);
                }
            }
        })
    );

    return ssidIds;
}

export async function validateEapAclPayloadReferences(
    client: OmadaClient,
    payload: z.infer<typeof eapAclPayloadSchema>,
    siteId?: string,
    customHeaders?: Record<string, string>
): Promise<void> {
    const lanNetworkIds = extractLanNetworkIds(await client.getLanNetworkList(siteId, customHeaders));

    if (payload.sourceType === 0) {
        const unknownSourceIds = payload.sourceIds.filter((sourceId) => !lanNetworkIds.has(sourceId));
        if (unknownSourceIds.length > 0) {
            throw new Error(
                `Unknown LAN network ids in sourceIds: ${unknownSourceIds.join(', ')}. Use getLanNetworkList and pass each network's id field.`
            );
        }
    }

    if (payload.destinationType === 0 && payload.destinationIds) {
        const unknownDestinationIds = payload.destinationIds.filter((destinationId) => !lanNetworkIds.has(destinationId));
        if (unknownDestinationIds.length > 0) {
            throw new Error(
                `Unknown LAN network ids in destinationIds: ${unknownDestinationIds.join(', ')}. Use getLanNetworkList and pass each network's id field.`
            );
        }
    }

    if (payload.sourceType === 4) {
        const ssidIds = await extractSsidIds(client, siteId, customHeaders);
        const unknownSsidIds = payload.sourceIds.filter((sourceId) => !ssidIds.has(sourceId));
        if (unknownSsidIds.length > 0) {
            throw new Error(`Unknown SSID ids in sourceIds: ${unknownSsidIds.join(', ')}. Use getWlanGroupList/getSsidList and pass each SSID id.`);
        }
    }
}
