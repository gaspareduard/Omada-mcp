import { setTimeout as delay } from 'node:timers/promises';

export interface FieldDifference {
    path: string;
    reason: 'missing' | 'different';
}

export interface VerificationResult {
    status: 'verified' | 'mismatch' | 'unknown' | 'unverifiable';
    attempts: number;
    differences: FieldDifference[];
    reason?: string;
}

export interface VerificationOptions {
    /** Hard caps: five reads, one second between reads, five seconds per read. */
    maxAttempts?: number;
    delayMs?: number;
    readTimeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Compare only requested object fields. Arrays retain their length and ordering.
 * Differences contain paths, never configuration values (which may be secrets).
 */
export function compareRequestedFields(requested: unknown, observed: unknown): VerificationResult {
    const differences: FieldDifference[] = [];
    let fields = 0;
    function compare(expected: unknown, actual: unknown, path: string): void {
        if (actual === undefined) {
            differences.push({ path, reason: 'missing' });
        } else if (Array.isArray(expected)) {
            fields++;
            if (!Array.isArray(actual) || expected.length !== actual.length) {
                differences.push({ path, reason: 'different' });
            } else {
                expected.forEach((item, index) => compare(item, actual[index], `${path}[${index}]`));
            }
        } else if (isRecord(expected)) {
            if (!isRecord(actual)) {
                differences.push({ path, reason: 'different' });
            } else {
                for (const [key, value] of Object.entries(expected)) {
                    compare(value, Object.hasOwn(actual, key) ? actual[key] : undefined, path ? `${path}.${key}` : key);
                }
            }
        } else {
            fields++;
            if (!Object.is(expected, actual)) differences.push({ path, reason: 'different' });
        }
    }
    compare(requested, observed, '');
    const status = differences.some((item) => item.reason === 'different')
        ? 'mismatch'
        : differences.length > 0 || fields === 0
          ? 'unverifiable'
          : 'verified';
    return { status, attempts: 0, differences };
}

function boundedOption(value: number | undefined, fallback: number, min: number, max: number): number {
    if (value === undefined) return fallback;
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Verification option must be an integer from ${min} to ${max}.`);
    return value;
}

/** Bounded read-after-write polling. This function never invokes a write. */
export async function verifyRequestedFields(
    requested: unknown,
    read: (() => Promise<unknown>) | undefined,
    options: VerificationOptions = {}
): Promise<VerificationResult> {
    const maxAttempts = boundedOption(options.maxAttempts, 3, 1, 5);
    const delayMs = boundedOption(options.delayMs, 100, 0, 1000);
    const readTimeoutMs = boundedOption(options.readTimeoutMs, 2000, 1, 5000);
    if (!read) return { status: 'unverifiable', attempts: 0, differences: [], reason: 'No documented readback is available.' };

    for (let attempts = 1; ; attempts++) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let timedOut = false;
        let result: VerificationResult;
        try {
            const observed = await Promise.race([
                Promise.resolve().then(read),
                new Promise<never>((_, reject) => {
                    timer = setTimeout(() => {
                        timedOut = true;
                        reject(new Error('Readback timed out.'));
                    }, readTimeoutMs);
                }),
            ]);
            result = { ...compareRequestedFields(requested, observed), attempts };
        } catch {
            result = { status: 'unknown', attempts, differences: [], reason: 'Readback failed or timed out; state is unknown.' };
        } finally {
            clearTimeout(timer);
        }
        // A timed-out read may still be in flight. Do not start overlapping reads.
        if (result.status === 'verified' || timedOut || attempts === maxAttempts) return result;
        if (delayMs > 0) await delay(delayMs);
    }
}

export interface VerifiedMutationResult {
    noOp: boolean;
    writeAcknowledged: boolean;
    applied?: unknown;
    verification: VerificationResult;
}

/** Apply at most once. Even a lost write response is reconciled using reads only. */
export async function applyWithVerification(input: {
    requested: unknown;
    before?: unknown;
    write: () => Promise<unknown>;
    read?: () => Promise<unknown>;
    options?: VerificationOptions;
}): Promise<VerifiedMutationResult> {
    // Invalid polling policy must fail before the side effect.
    boundedOption(input.options?.maxAttempts, 3, 1, 5);
    boundedOption(input.options?.delayMs, 100, 0, 1000);
    boundedOption(input.options?.readTimeoutMs, 2000, 1, 5000);
    const before = compareRequestedFields(input.requested, input.before);
    if (before.status === 'verified') return { noOp: true, writeAcknowledged: false, verification: before };
    let applied: unknown;
    let writeAcknowledged = false;
    try {
        applied = await input.write();
        writeAcknowledged = true;
    } catch {
        // A thrown transport/controller error does not prove whether a write took effect.
        // Never expose the raw error (it may contain the request payload) or replay it.
    }
    const verification = await verifyRequestedFields(input.requested, input.read, input.options);
    if (!writeAcknowledged && verification.status !== 'verified') {
        verification.status = 'unknown';
        verification.reason = 'Write was not acknowledged and readback could not confirm the requested state. Do not blindly retry.';
    }
    return { noOp: false, writeAcknowledged, ...(writeAcknowledged ? { applied } : {}), verification };
}
