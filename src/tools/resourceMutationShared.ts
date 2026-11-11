import { setTimeout as delay } from 'node:timers/promises';

import { z } from 'zod';

import { OmadaApiError } from '../omadaClient/request.js';
import type { MutationSummary } from '../server/common.js';
import { compareRequestedFields, type FieldDifference } from '../utils/verification.js';

/**
 * Shared engine for configuration write tools (create / update / delete / settings).
 *
 * Contract (docs/operations/0.19-migration.md):
 * - Omitting dryRun previews; payloads are validated before preview and apply.
 * - A write is sent at most once. An explicit controller rejection (non-zero errorCode)
 *   is reported as an error; any other failure leaves the outcome uncertain and is
 *   reconciled by reads only, never by replaying the write.
 * - `verified` is reported only after the requested fields are read back.
 */

export const dryRunSchema = z
    .boolean()
    .default(true)
    .describe('Preview by default. Set false to apply the validated change once and verify it by reading the controller back.');

export type RecordLike = Record<string, unknown>;

export interface ResourceSpec {
    /** Human label used in messages, e.g. "static route". */
    label: string;
    /** Reads the complete collection (all pages) the record lives in. */
    list: () => Promise<unknown>;
    /** Candidate identifier fields on read records, in priority order. Default: ['id']. */
    idKeys?: readonly string[];
    /** Field that must be unique within the collection. Default 'name'; null disables the check. */
    nameKey?: string | null;
    /** Requested fields the read surface never returns (secrets, write-only options). */
    writeOnly?: readonly string[];
}

export interface Verification {
    status: 'verified' | 'mismatch' | 'unknown' | 'unverifiable';
    attempts: number;
    differences: FieldDifference[];
    reason?: string;
}

export interface VerifyOptions {
    attempts?: number;
    delayMs?: number;
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_DELAY_MS = 300;

function isRecord(value: unknown): value is RecordLike {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Accepts a bare array or a paginated `{ data: [] }` envelope. */
export function toRecords(value: unknown): RecordLike[] {
    const items = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.data) ? value.data : undefined;
    if (!items) throw new Error('The controller returned an unexpected collection shape; current state cannot be established.');
    return items.filter(isRecord);
}

export function recordId(record: RecordLike, idKeys: readonly string[] = ['id']): string | undefined {
    for (const key of idKeys) {
        const value = record[key];
        if ((typeof value === 'string' && value.length > 0) || typeof value === 'number') return String(value);
    }
    return undefined;
}

export function findRecord(records: RecordLike[], id: string, idKeys?: readonly string[]): RecordLike | undefined {
    return records.find((record) => recordId(record, idKeys) === id);
}

function omitKeys(payload: RecordLike, keys: readonly string[] = []): RecordLike {
    return Object.fromEntries(Object.entries(payload).filter(([key]) => !keys.includes(key)));
}

function writeOnlyRequested(payload: RecordLike, keys: readonly string[] = []): string[] {
    return keys.filter((key) => payload[key] !== undefined);
}

function nameClash(spec: ResourceSpec, records: RecordLike[], payload: RecordLike, exceptId?: string): void {
    const nameKey = spec.nameKey === undefined ? 'name' : spec.nameKey;
    if (!nameKey) return;
    const name = payload[nameKey];
    if (typeof name !== 'string') return;
    const clashes = records.filter((record) => record[nameKey] === name && recordId(record, spec.idKeys) !== exceptId);
    if (clashes.length > 0) {
        const ids = clashes.map((record) => recordId(record, spec.idKeys) ?? 'unknown-id').join(', ');
        throw new Error(`A ${spec.label} named "${name}" already exists (${ids}). Update that ${spec.label} or choose another name.`);
    }
}

interface WriteOutcome {
    acknowledged: boolean;
    applied?: unknown;
}

/** Send the write exactly once. Explicit rejections and local validation errors are definitive. */
export async function attemptWrite(label: string, action: string, write: () => Promise<unknown>): Promise<WriteOutcome> {
    try {
        return { acknowledged: true, applied: await write() };
    } catch (error) {
        if (error instanceof OmadaApiError) {
            throw new Error(`The controller rejected the ${label} ${action} (errorCode ${error.errorCode}): ${error.message}`);
        }
        if (error instanceof z.ZodError) throw error;
        // Transport failures do not prove whether the write took effect. Never echo the raw
        // error (it may contain the request payload) and never replay the write.
        return { acknowledged: false };
    }
}

/**
 * Bounded read-after-write polling. `read` returns the record, or undefined when absent.
 * With `expectAbsent`, success means the record is gone.
 */
export async function pollVerification(
    read: () => Promise<RecordLike | undefined>,
    requested: RecordLike | undefined,
    acknowledged: boolean,
    options: VerifyOptions = {}
): Promise<Verification> {
    const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
    const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
    let last: Verification = { status: 'unknown', attempts: 0, differences: [], reason: 'No readback was performed.' };
    for (let attempt = 1; attempt <= attempts; attempt++) {
        if (attempt > 1 && delayMs > 0) await delay(delayMs);
        let observed: RecordLike | undefined;
        try {
            observed = await read();
        } catch {
            last = { status: 'unknown', attempts: attempt, differences: [], reason: 'Readback failed; current state is unknown.' };
            continue;
        }
        if (requested === undefined) {
            if (observed === undefined) return { status: 'verified', attempts: attempt, differences: [] };
            last = { status: 'mismatch', attempts: attempt, differences: [], reason: 'The record is still present.' };
            continue;
        }
        if (observed === undefined) {
            last = { status: 'unknown', attempts: attempt, differences: [], reason: 'The record is not visible in the readback.' };
            continue;
        }
        const compared = compareRequestedFields(requested, observed);
        last = { ...compared, attempts: attempt };
        if (compared.status === 'verified' || compared.status === 'unverifiable') return last;
    }
    if (!acknowledged && last.status !== 'verified') {
        return {
            ...last,
            status: 'unknown',
            reason: 'The write was not acknowledged and readback could not confirm the requested state. Read current state before retrying.',
        };
    }
    return last;
}

export interface CreateInput {
    spec: ResourceSpec;
    payload: RecordLike;
    dryRun: boolean;
    write: () => Promise<unknown>;
    warnings?: string[];
    verify?: VerifyOptions;
}

export async function runCreate(input: CreateInput): Promise<RecordLike> {
    const { spec, payload } = input;
    const before = toRecords(await spec.list());
    nameClash(spec, before, payload);
    const warnings = input.warnings?.length ? { warnings: input.warnings } : {};
    if (input.dryRun) return { accepted: true, dryRun: true, planned: payload, existingCount: before.length, ...warnings };

    const knownIds = new Set(before.map((record) => recordId(record, spec.idKeys)));
    const nameKey = spec.nameKey === undefined ? 'name' : spec.nameKey;
    const name = nameKey ? payload[nameKey] : undefined;
    let createdId: string | undefined;
    const outcome = await attemptWrite(spec.label, 'creation', input.write);
    const verification = await pollVerification(
        async () => {
            const fresh = toRecords(await spec.list()).filter(
                (record) => !knownIds.has(recordId(record, spec.idKeys)) && (typeof name !== 'string' || record[nameKey as string] === name)
            );
            if (fresh.length > 1) throw new Error('ambiguous');
            createdId = fresh[0] ? recordId(fresh[0], spec.idKeys) : undefined;
            return fresh[0];
        },
        omitKeys(payload, spec.writeOnly),
        outcome.acknowledged,
        input.verify
    );
    return {
        writeAcknowledged: outcome.acknowledged,
        ...(outcome.acknowledged ? { applied: outcome.applied } : {}),
        ...(createdId ? { createdId } : {}),
        verification,
        ...notVerified(payload, spec.writeOnly),
        ...warnings,
    };
}

function notVerified(payload: RecordLike, keys?: readonly string[]): RecordLike {
    const fields = writeOnlyRequested(payload, keys);
    return fields.length ? { notVerifiedFields: fields } : {};
}

export interface UpdateInput extends CreateInput {
    id: string;
}

export async function runUpdate(input: UpdateInput): Promise<RecordLike> {
    const { spec, payload, id } = input;
    const records = toRecords(await spec.list());
    const before = findRecord(records, id, spec.idKeys);
    if (!before) throw new Error(`No ${spec.label} with id "${id}" exists. List them again to get a current id.`);
    nameClash(spec, records, payload, id);
    const requested = omitKeys(payload, spec.writeOnly);
    const current = compareRequestedFields(requested, before);
    const alreadyMatches = current.status === 'verified' && writeOnlyRequested(payload, spec.writeOnly).length === 0;
    const warnings = input.warnings?.length ? { warnings: input.warnings } : {};
    if (input.dryRun) {
        return { accepted: true, dryRun: true, id, before, planned: payload, alreadyMatches, differences: current.differences, ...warnings };
    }
    if (alreadyMatches) {
        return { noOp: true, writeAcknowledged: false, id, verification: { ...current, attempts: 0 }, ...warnings };
    }
    const outcome = await attemptWrite(spec.label, 'update', input.write);
    const verification = await pollVerification(
        async () => findRecord(toRecords(await spec.list()), id, spec.idKeys),
        requested,
        outcome.acknowledged,
        input.verify
    );
    return {
        noOp: false,
        writeAcknowledged: outcome.acknowledged,
        ...(outcome.acknowledged ? { applied: outcome.applied } : {}),
        id,
        verification,
        ...notVerified(payload, spec.writeOnly),
        ...warnings,
    };
}

export interface DeleteInput {
    spec: ResourceSpec;
    id: string;
    dryRun: boolean;
    write: () => Promise<unknown>;
    /** Throw to refuse deleting a protected record (default/system objects, records in use). */
    guard?: (record: RecordLike, records: RecordLike[]) => void | Promise<void>;
    warnings?: string[];
    verify?: VerifyOptions;
}

export async function runDelete(input: DeleteInput): Promise<RecordLike> {
    const { spec, id } = input;
    const records = toRecords(await spec.list());
    const before = findRecord(records, id, spec.idKeys);
    if (!before) throw new Error(`No ${spec.label} with id "${id}" exists. List them again to get a current id.`);
    await input.guard?.(before, records);
    const warnings = input.warnings?.length ? { warnings: input.warnings } : {};
    if (input.dryRun) return { accepted: true, dryRun: true, id, before, ...warnings };
    const outcome = await attemptWrite(spec.label, 'deletion', input.write);
    const verification = await pollVerification(
        async () => findRecord(toRecords(await spec.list()), id, spec.idKeys),
        undefined,
        outcome.acknowledged,
        input.verify
    );
    return { writeAcknowledged: outcome.acknowledged, ...(outcome.acknowledged ? { applied: outcome.applied } : {}), id, verification, ...warnings };
}

export interface SettingsInput {
    label: string;
    read: () => Promise<unknown>;
    payload: RecordLike;
    dryRun: boolean;
    write: () => Promise<unknown>;
    writeOnly?: readonly string[];
    warnings?: string[];
    verify?: VerifyOptions;
}

/** Singleton settings objects (UPnP, ALG, SNMP, attack defense, IPS). */
export async function runSettings(input: SettingsInput): Promise<RecordLike> {
    const readObject = async (): Promise<RecordLike> => {
        const value = await input.read();
        if (!isRecord(value)) throw new Error(`The controller returned unexpected ${input.label} settings; current state cannot be established.`);
        return value;
    };
    const before = await readObject();
    const requested = omitKeys(input.payload, input.writeOnly);
    const current = compareRequestedFields(requested, before);
    const alreadyMatches = current.status === 'verified' && writeOnlyRequested(input.payload, input.writeOnly).length === 0;
    const warnings = input.warnings?.length ? { warnings: input.warnings } : {};
    if (input.dryRun) {
        return { accepted: true, dryRun: true, before, planned: input.payload, alreadyMatches, differences: current.differences, ...warnings };
    }
    if (alreadyMatches) return { noOp: true, writeAcknowledged: false, verification: { ...current, attempts: 0 }, ...warnings };
    const outcome = await attemptWrite(input.label, 'settings update', input.write);
    const verification = await pollVerification(readObject, requested, outcome.acknowledged, input.verify);
    return {
        noOp: false,
        writeAcknowledged: outcome.acknowledged,
        ...(outcome.acknowledged ? { applied: outcome.applied } : {}),
        verification,
        ...notVerified(input.payload, input.writeOnly),
        ...warnings,
    };
}

export interface ActionInput {
    label: string;
    dryRun: boolean;
    /** Validates the target exists and returns the evidence shown in the preview. */
    preflight: () => Promise<RecordLike>;
    write: () => Promise<unknown>;
    warnings?: string[];
}

/** One-shot commands (locate, provision, adopt, upgrade, PoE recovery) with no readable end state. */
export async function runAction(input: ActionInput): Promise<RecordLike> {
    const target = await input.preflight();
    const warnings = input.warnings?.length ? { warnings: input.warnings } : {};
    if (input.dryRun) return { accepted: true, dryRun: true, target, ...warnings };
    const outcome = await attemptWrite(input.label, 'request', input.write);
    if (!outcome.acknowledged) {
        return {
            writeAcknowledged: false,
            target,
            verification: {
                status: 'unknown',
                attempts: 0,
                differences: [],
                reason: 'The request was not acknowledged and this action has no readable end state. Check device state before retrying.',
            },
            ...warnings,
        };
    }
    return { writeAcknowledged: true, applied: outcome.applied, target, ...warnings };
}

type SummaryArgs = { siteId?: string } & Record<string, unknown>;

/** Standard mutation summary; status is normalised from result.verification by toMutationResult. */
export function mutationSummary(
    action: string,
    target: (args: SummaryArgs) => string
): (args: SummaryArgs, result: unknown, mode: 'apply' | 'dry-run') => MutationSummary {
    return (args, result, mode) => ({
        action,
        target: target(args),
        siteId: args.siteId,
        mode,
        status: mode === 'dry-run' ? 'planned' : 'applied',
        summary: `${action} ${mode === 'dry-run' ? 'planned' : 'processed'} for ${target(args)}.`,
        result,
    });
}

export function normalizeMac(mac: string): string {
    return mac.replace(/[:-]/g, '').toUpperCase();
}

/** Find one record by MAC (any separator/case) or fail before any write is sent. */
export function requireByMac(records: unknown, mac: string, label: string): RecordLike {
    const wanted = normalizeMac(mac);
    const match = toRecords(records).find((record) => typeof record.mac === 'string' && normalizeMac(record.mac) === wanted);
    if (!match) throw new Error(`No ${label} with MAC ${mac} exists in this site. No request was sent.`);
    return match;
}

/** Keep previews small: echo only identifying and state fields of a device or client. */
export function pick(record: RecordLike, keys: readonly string[]): RecordLike {
    return Object.fromEntries(keys.filter((key) => record[key] !== undefined).map((key) => [key, record[key]]));
}
