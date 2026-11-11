import { z } from 'zod';

import {
    createDdnsOpenApiVOSchema,
    createSsidOpenApiVOSchema,
    createVoucherGroupOpenApiVO06Schema,
    lanDnsOpenApiVOSchema,
    lanProfileConfigOpenApiVOSchema,
} from '../omadaClient/requestSchemas.js';
import type { RecordLike } from './resourceMutationShared.js';

/**
 * Requirements the controller enforces beyond the official schemas, observed on a
 * live controller (Omada Software Controller, ER605 v2.20). Checking them here lets
 * previews fail with a clear message instead of an opaque "General error" on apply.
 */

export const ddnsPayloadSchema = createDdnsOpenApiVOSchema.superRefine((payload, ctx) => {
    const interval = payload.interval;
    if (!interval || (interval.updateInterval === undefined) === (interval.customInterval === undefined)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['interval'],
            message: 'The controller requires interval with exactly one of updateInterval (hours) or customInterval (minutes).',
        });
    }
});

/** DDNS reads flatten interval into top-level updateInterval / customInterval fields. */
export function normalizeDdnsRecord(record: RecordLike): RecordLike {
    const interval = record.existCustomInterval === true ? { customInterval: record.customInterval } : { updateInterval: record.updateInterval };
    return { ...record, interval };
}

export const lanDnsPayloadSchema = lanDnsOpenApiVOSchema.superRefine((payload, ctx) => {
    if (!payload.lanNetworkIds?.length) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['lanNetworkIds'],
            message: 'The controller requires at least one LAN network ID (getLanNetworkList) that the rule applies to.',
        });
    }
});

export const lanProfileUpdatePayloadSchema = lanProfileConfigOpenApiVOSchema.superRefine((payload, ctx) => {
    if (payload.untagNetworkIds === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['untagNetworkIds'],
            message: 'The controller requires untagNetworkIds on updates. Send the current list from getLanProfileList, or [] for none.',
        });
    }
});

/** Documented in the field description only: vlanId is required when vlanEnable is true. */
export const ssidPayloadSchema = createSsidOpenApiVOSchema.superRefine((payload, ctx) => {
    if (payload.vlanEnable && payload.vlanId === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vlanId'], message: 'vlanId (1-4094) is required when vlanEnable is true.' });
    }
    if (payload.security === 3 && !payload.pskSetting?.securityKey) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['pskSetting', 'securityKey'],
            message: 'WPA-Personal (security 3) requires pskSetting.securityKey.',
        });
    }
});

/** rateLimit.mode 0 needs customRateLimit; mode 1 needs rateLimitProfileId (field descriptions). */
export const voucherGroupPayloadSchema = createVoucherGroupOpenApiVO06Schema.superRefine((payload, ctx) => {
    const { mode, customRateLimit, rateLimitProfileId } = payload.rateLimit;
    if (mode === 0 && !customRateLimit) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rateLimit', 'customRateLimit'], message: 'rateLimit.mode 0 requires customRateLimit.' });
    }
    if (mode === 1 && !rateLimitProfileId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['rateLimit', 'rateLimitProfileId'],
            message: 'rateLimit.mode 1 requires rateLimitProfileId.',
        });
    }
});
