import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema } from '../server/common.js';
import { ipv4Schema } from './dhcpReservationShared.js';

const ruleIdSchema = z.string().trim().min(1, 'ruleId is required.');

export const appControlCreatePayloadSchema = z
    .object({
        ruleName: z.string().trim().min(1).max(128),
        schedule: z.string().trim().min(1, 'schedule is required. Use listTimeRangeProfiles to find the schedule profile id.'),
        qos: z.boolean(),
        qosClass: z.number().int().min(0).max(3).optional(),
        applications: z.array(z.number().int()).min(1, 'At least one application id is required.'),
        selectType: z.enum(['include', 'exclude', 'all']),
    })
    .superRefine((payload, ctx) => {
        if (payload.qos && payload.qosClass === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'qosClass is required when qos is enabled.',
                path: ['qosClass'],
            });
        }
    });

export const setAppControlRuleInputSchema = siteInputSchema.extend({
    ruleId: ruleIdSchema.optional(),
    payload: z
        .record(z.string(), z.unknown())
        .describe('Application control rule payload matching the Omada Open API schema for the selected operation.'),
    dryRun: z.boolean().optional().default(false),
});

export const appControlUpdatePayloadSchema = z
    .object({
        ruleName: z.string().trim().min(1).max(128),
        schedule: z.string().trim().min(1, 'schedule is required. Use listTimeRangeProfiles to find the schedule profile id.'),
        qos: z.boolean(),
        qosClass: z.number().int().min(0).max(3).optional(),
        applications: z.array(z.number().int()).min(1, 'At least one application id is required.'),
    })
    .superRefine((payload, ctx) => {
        if (payload.qos && payload.qosClass === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'qosClass is required when qos is enabled.',
                path: ['qosClass'],
            });
        }
    });

export const deleteAppControlRuleInputSchema = siteInputSchema.extend({
    ruleId: ruleIdSchema,
    dryRun: z.boolean().optional().default(false),
});

export const bandwidthControlRulePayloadSchema = z.object({
    name: z.string().trim().min(1).max(64),
    status: z.boolean(),
    sourceType: z.number().int().optional(),
    sourceIds: z.array(z.string().trim().min(1)).min(1, 'At least one source id is required.'),
    wanPortIds: z.array(z.string().trim().min(1)).min(1, 'At least one WAN port id is required.'),
    upstreamBandwidth: z.number().int().min(1).max(9_999_999),
    upstreamBandwidthUnit: z
        .number()
        .int()
        .refine((value) => value === 1 || value === 2, 'upstreamBandwidthUnit must be 1 (Kbps) or 2 (Mbps).'),
    downstreamBandwidth: z.number().int().min(1).max(9_999_999),
    downstreamBandwidthUnit: z
        .number()
        .int()
        .refine((value) => value === 1 || value === 2, 'downstreamBandwidthUnit must be 1 (Kbps) or 2 (Mbps).'),
    mode: z
        .number()
        .int()
        .refine((value) => value === 0 || value === 1, 'mode must be 0 (share) or 1 (individual).'),
});

export const setBandwidthControlRuleInputSchema = siteInputSchema.extend({
    ruleId: ruleIdSchema.optional(),
    payload: bandwidthControlRulePayloadSchema.describe('Bandwidth control rule payload following the official Omada BandwidthControlRule schema.'),
    dryRun: z.boolean().optional().default(false),
});

export const deleteBandwidthControlRuleInputSchema = siteInputSchema.extend({
    ruleId: ruleIdSchema,
    dryRun: z.boolean().optional().default(false),
});

const preAuthAccessPolicySchema = z
    .object({
        idInt: z.number().int().optional(),
        type: z
            .number()
            .int()
            .refine((value) => value === 1 || value === 2, 'type must be 1 (Destination IP Range) or 2 (URL).'),
        ip: ipv4Schema.optional(),
        subnetMask: z.number().int().min(1).max(32).optional(),
        url: z.string().trim().min(1).optional(),
    })
    .superRefine((policy, ctx) => {
        if (policy.type === 1) {
            if (!policy.ip) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ip is required when type is 1.', path: ['ip'] });
            }
            if (policy.subnetMask === undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'subnetMask is required when type is 1.',
                    path: ['subnetMask'],
                });
            }
        }

        if (policy.type === 2 && !policy.url) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'url is required when type is 2.', path: ['url'] });
        }
    });

const freeAuthClientPolicySchema = z
    .object({
        idInt: z.number().int().optional(),
        type: z
            .number()
            .int()
            .refine((value) => value === 3 || value === 4, 'type must be 3 (client IP) or 4 (client MAC).'),
        clientIp: ipv4Schema.optional(),
        clientMac: deviceMacSchema.optional(),
    })
    .superRefine((policy, ctx) => {
        if (policy.type === 3 && !policy.clientIp) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'clientIp is required when type is 3.',
                path: ['clientIp'],
            });
        }

        if (policy.type === 4 && !policy.clientMac) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'clientMac is required when type is 4.',
                path: ['clientMac'],
            });
        }
    });

export const accessControlPayloadSchema = z
    .object({
        preAuthAccessEnable: z.boolean(),
        preAuthAccessPolicies: z.array(preAuthAccessPolicySchema).optional(),
        freeAuthClientEnable: z.boolean(),
        freeAuthClientPolicies: z.array(freeAuthClientPolicySchema).optional(),
    })
    .superRefine((payload, ctx) => {
        if (payload.preAuthAccessEnable && (!payload.preAuthAccessPolicies || payload.preAuthAccessPolicies.length === 0)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'preAuthAccessPolicies is required when preAuthAccessEnable is true.',
                path: ['preAuthAccessPolicies'],
            });
        }

        if (payload.freeAuthClientEnable && (!payload.freeAuthClientPolicies || payload.freeAuthClientPolicies.length === 0)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'freeAuthClientPolicies is required when freeAuthClientEnable is true.',
                path: ['freeAuthClientPolicies'],
            });
        }
    });

export const setAccessControlInputSchema = siteInputSchema.extend({
    payload: accessControlPayloadSchema.describe('Access control payload following the official Omada PortalAccessControlOpenApiVO schema.'),
    dryRun: z.boolean().optional().default(false),
});

interface GridRecord {
    id?: string | number;
    ruleId?: string | number;
    aclId?: string | number;
}

export function extractGridRecords(value: unknown): Record<string, unknown>[] {
    if (!value || typeof value !== 'object') {
        return [];
    }

    const data = (value as { data?: unknown }).data;
    return Array.isArray(data) ? data.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null) : [];
}

export function findGridRecordById(value: unknown, targetId: string): GridRecord | undefined {
    return extractGridRecords(value).find((entry) => {
        const record = entry as GridRecord;
        return String(record.id ?? record.ruleId ?? record.aclId ?? '') === targetId;
    }) as GridRecord | undefined;
}

function extractLanNetworkIds(value: unknown[]): Set<string> {
    return new Set(
        value
            .filter((entry): entry is { id?: string } => typeof entry === 'object' && entry !== null)
            .map((entry) => entry.id)
            .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    );
}

async function fetchAllApplicationIds(client: OmadaClient, siteId?: string, customHeaders?: Record<string, string>): Promise<Set<number>> {
    const pageSize = 1000;
    const applicationIds = new Set<number>();

    for (let page = 1; ; page += 1) {
        const response = await client.getApplications(page, pageSize, undefined, undefined, siteId, customHeaders);
        const pageRecords = extractGridRecords(response);
        for (const record of pageRecords) {
            const applicationId = record['applicationId'];
            const fallbackId = record['id'];
            if (typeof applicationId === 'number') {
                applicationIds.add(applicationId);
            } else if (typeof fallbackId === 'number') {
                applicationIds.add(fallbackId);
            }
        }
        if (pageRecords.length < pageSize) {
            break;
        }
    }

    return applicationIds;
}

export async function parseAppControlPayload(
    client: OmadaClient,
    ruleId: string | undefined,
    payload: unknown,
    siteId?: string,
    customHeaders?: Record<string, string>
): Promise<Record<string, unknown>> {
    const parsedPayload = ruleId ? appControlUpdatePayloadSchema.parse(payload) : appControlCreatePayloadSchema.parse(payload);
    const validApplicationIds = await fetchAllApplicationIds(client, siteId, customHeaders);
    const unknownApplicationIds = parsedPayload.applications.filter((applicationId) => !validApplicationIds.has(applicationId));

    if (unknownApplicationIds.length > 0) {
        throw new Error(
            `Unknown application ids: ${unknownApplicationIds.join(', ')}. Use the documented application-control applications endpoint to discover valid applicationId values.`
        );
    }

    return parsedPayload as Record<string, unknown>;
}

export async function validateBandwidthControlPayloadReferences(
    client: OmadaClient,
    payload: z.infer<typeof bandwidthControlRulePayloadSchema>,
    siteId?: string,
    customHeaders?: Record<string, string>
): Promise<void> {
    if (payload.sourceType === 0) {
        const lanNetworkIds = extractLanNetworkIds(await client.getLanNetworkList(siteId, customHeaders));
        const unknownSourceIds = payload.sourceIds.filter((sourceId) => !lanNetworkIds.has(sourceId));
        if (unknownSourceIds.length > 0) {
            throw new Error(
                `Unknown LAN network ids in sourceIds: ${unknownSourceIds.join(', ')}. Use getLanNetworkList and pass each network's id field.`
            );
        }
    }

    const internetInfo = (await client
        .getInternetBasicPortInfo(siteId, customHeaders)
        .catch(async () => await client.getInternetInfo(siteId, customHeaders))) as {
        portUuids?: unknown[];
        wanPortSettings?: Array<{ portId?: string }>;
        portList?: Array<{ portId?: string }>;
    };
    const validWanPortIds = new Set<string>([
        ...(Array.isArray(internetInfo.portUuids) ? internetInfo.portUuids.filter((value): value is string => typeof value === 'string') : []),
        ...(Array.isArray(internetInfo.wanPortSettings)
            ? internetInfo.wanPortSettings
                  .map((entry) => entry.portId)
                  .filter((value): value is string => typeof value === 'string' && value.length > 0)
            : []),
        ...(Array.isArray(internetInfo.portList)
            ? internetInfo.portList.map((entry) => entry.portId).filter((value): value is string => typeof value === 'string' && value.length > 0)
            : []),
    ]);
    const unknownWanPortIds = payload.wanPortIds.filter((wanPortId) => !validWanPortIds.has(wanPortId));
    if (unknownWanPortIds.length > 0) {
        throw new Error(
            `Unknown WAN port ids: ${unknownWanPortIds.join(', ')}. Use getInternetBasicPortInfo (or getInternetInfo) and pass values from portUuids or wanPortSettings.portId.`
        );
    }
}
