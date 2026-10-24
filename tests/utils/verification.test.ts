import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyWithVerification, compareRequestedFields, verifyRequestedFields } from '../../src/utils/verification.js';

afterEach(() => vi.useRealTimers());

describe('semantic verification', () => {
    it('compares only requested fields, including false, zero, null, nested objects and ordered arrays', () => {
        expect(
            compareRequestedFields(
                { radio: { enabled: false, power: 0 }, tags: ['b', 'a'], optional: null },
                {
                    radio: { enabled: false, power: 0, channel: 6 },
                    tags: ['b', 'a'],
                    optional: null,
                    unrelated: true,
                }
            ).status
        ).toBe('verified');
        expect(compareRequestedFields({ tags: ['b', 'a'] }, { tags: ['a', 'b'] }).status).toBe('mismatch');
        expect(compareRequestedFields({ tags: [] }, { tags: [] }).status).toBe('verified');
    });

    it.each([
        [{ a: 1 }, { a: '1' }, 'mismatch'],
        [{ a: { b: true } }, { a: false }, 'mismatch'],
        [{ a: [1] }, { a: [] }, 'mismatch'],
        [{ a: [1] }, { a: {} }, 'mismatch'],
        [{ a: 1 }, {}, 'unverifiable'],
        [{}, {}, 'unverifiable'],
        [{ a: 1 }, Object.create({ a: 1 }), 'unverifiable'],
    ])('distinguishes incompatible and absent data (%j)', (requested, observed, status) => {
        expect(compareRequestedFields(requested, observed).status).toBe(status);
    });

    it('reports paths without either secret value', () => {
        const diff = compareRequestedFields({ password: 'private-value', radio: { enable: true } }, { password: 'wrong-private-value' });
        expect(diff).toMatchObject({
            status: 'mismatch',
            differences: [
                { path: 'password', reason: 'different' },
                { path: 'radio', reason: 'missing' },
            ],
        });
        expect(JSON.stringify(diff)).not.toContain('private-value');
    });

    it('bounds retries while permitting delayed convergence', async () => {
        vi.useFakeTimers();
        const read = vi.fn().mockResolvedValueOnce({ on: false }).mockResolvedValueOnce({ on: false }).mockResolvedValue({ on: true });
        const pending = verifyRequestedFields({ on: true }, read);
        await vi.runAllTimersAsync();
        expect(await pending).toMatchObject({ status: 'verified', attempts: 3 });
        expect(read).toHaveBeenCalledTimes(3);
    });

    it('reports ignored fields as mismatch after the bounded window', async () => {
        const read = vi.fn().mockResolvedValue({ on: false });
        expect(await verifyRequestedFields({ on: true }, read, { maxAttempts: 2, delayMs: 0 })).toMatchObject({ status: 'mismatch', attempts: 2 });
        expect(read).toHaveBeenCalledTimes(2);
    });

    it('distinguishes unavailable readback, missing fields, and failed reads', async () => {
        expect(await verifyRequestedFields({ on: true }, undefined)).toMatchObject({ status: 'unverifiable', attempts: 0 });
        expect(await verifyRequestedFields({ on: true }, vi.fn().mockResolvedValue({}), { maxAttempts: 1 })).toMatchObject({
            status: 'unverifiable',
            attempts: 1,
        });
        const read = vi.fn().mockRejectedValue(new Error('secret-error-detail'));
        const result = await verifyRequestedFields({ on: true }, read, { delayMs: 0 });
        expect(result).toMatchObject({ status: 'unknown', attempts: 3 });
        expect(JSON.stringify(result)).not.toContain('secret-error-detail');
    });

    it('stops on a timed-out read without overlapping another read', async () => {
        vi.useFakeTimers();
        const read = vi.fn(
            () =>
                new Promise(() => {
                    /* Deliberately never resolves. */
                })
        );
        const pending = verifyRequestedFields({ on: true }, read, { readTimeoutMs: 10 });
        await vi.advanceTimersByTimeAsync(10);
        expect(await pending).toMatchObject({ status: 'unknown', attempts: 1 });
        expect(read).toHaveBeenCalledTimes(1);
    });

    it.each([
        { maxAttempts: 0 },
        { maxAttempts: 6 },
        { delayMs: -1 },
        { readTimeoutMs: 5001 },
        { delayMs: Number.NaN },
    ])('rejects unbounded options before writes: %j', async (options) => {
        const write = vi.fn();
        await expect(applyWithVerification({ requested: { on: true }, write, options })).rejects.toThrow('Verification option');
        expect(write).not.toHaveBeenCalled();
    });

    it('skips a write when the before-state already matches', async () => {
        const write = vi.fn();
        const read = vi.fn();
        expect(await applyWithVerification({ requested: { on: true }, before: { on: true, extra: 1 }, write, read })).toMatchObject({
            noOp: true,
            writeAcknowledged: false,
            verification: { status: 'verified', attempts: 0 },
        });
        expect(write).not.toHaveBeenCalled();
        expect(read).not.toHaveBeenCalled();
    });

    it('submits a write once, then verifies the requested state', async () => {
        const write = vi.fn().mockResolvedValue({ accepted: true });
        const read = vi.fn().mockResolvedValue({ on: true });
        expect(await applyWithVerification({ requested: { on: true }, before: { on: false }, write, read })).toMatchObject({
            noOp: false,
            writeAcknowledged: true,
            applied: { accepted: true },
            verification: { status: 'verified', attempts: 1 },
        });
        expect(write).toHaveBeenCalledTimes(1);
    });

    it.each([true, false])('reconciles a lost write response without replay (state matches=%s)', async (on) => {
        const write = vi.fn().mockRejectedValue(new Error('lost response'));
        const result = await applyWithVerification({
            requested: { on: true },
            write,
            read: vi.fn().mockResolvedValue({ on }),
            options: { delayMs: 0 },
        });
        expect(result.verification.status).toBe(on ? 'verified' : 'unknown');
        expect(result.writeAcknowledged).toBe(false);
        expect(write).toHaveBeenCalledTimes(1);
    });

    it('reports a setter-only accepted write as unverifiable and a lost response as unknown', async () => {
        expect((await applyWithVerification({ requested: { on: true }, write: vi.fn().mockResolvedValue(undefined) })).verification.status).toBe(
            'unverifiable'
        );
        expect(
            (await applyWithVerification({ requested: { on: true }, write: vi.fn().mockRejectedValue(new Error('timeout')) })).verification.status
        ).toBe('unknown');
    });
});
