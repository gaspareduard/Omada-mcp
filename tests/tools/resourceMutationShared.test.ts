import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { OmadaApiError } from '../../src/omadaClient/request.js';
import {
    attemptWrite,
    dryRunSchema,
    findRecord,
    mutationSummary,
    pollVerification,
    recordId,
    runAction,
    runCreate,
    runDelete,
    runSettings,
    runUpdate,
    toRecords,
} from '../../src/tools/resourceMutationShared.js';

const fast = { delayMs: 0 };

/** Returns successive collection snapshots; the last one repeats. */
function snapshots(...values: unknown[]): () => Promise<unknown> {
    let index = 0;
    return vi.fn(async () => values[Math.min(index++, values.length - 1)]);
}

describe('tools/resourceMutationShared', () => {
    describe('helpers', () => {
        it('defaults dryRun to a preview', () => {
            expect(dryRunSchema.parse(undefined)).toBe(true);
            expect(dryRunSchema.parse(false)).toBe(false);
        });

        it('reads arrays and paginated envelopes and rejects other shapes', () => {
            expect(toRecords([{ id: 'a' }, 'junk', null])).toEqual([{ id: 'a' }]);
            expect(toRecords({ data: [{ id: 'b' }] })).toEqual([{ id: 'b' }]);
            expect(() => toRecords({ result: [] })).toThrow('unexpected collection shape');
        });

        it('resolves ids by key priority, including numeric ids', () => {
            expect(recordId({ wlanId: 'w1', id: '' }, ['id', 'wlanId'])).toBe('w1');
            expect(recordId({ id: 7 })).toBe('7');
            expect(recordId({})).toBeUndefined();
            expect(findRecord([{ id: 'a' }, { id: 'b' }], 'b')).toEqual({ id: 'b' });
        });

        it('builds standard mutation summaries', () => {
            const summary = mutationSummary('create-x', (args) => String(args.name));
            expect(summary({ name: 'n', siteId: 's' }, { ok: 1 }, 'dry-run')).toEqual({
                action: 'create-x',
                target: 'n',
                siteId: 's',
                mode: 'dry-run',
                status: 'planned',
                summary: 'create-x planned for n.',
                result: { ok: 1 },
            });
            expect(summary({ name: 'n' }, undefined, 'apply')).toMatchObject({ status: 'applied', summary: 'create-x processed for n.' });
        });
    });

    describe('attemptWrite', () => {
        it('reports controller rejections with their error code', async () => {
            await expect(
                attemptWrite('static route', 'creation', () => Promise.reject(new OmadaApiError(-33006, 'This name already exists in this site.')))
            ).rejects.toThrow('The controller rejected the static route creation (errorCode -33006): This name already exists in this site.');
        });

        it('rethrows local validation errors', async () => {
            await expect(attemptWrite('x', 'update', async () => z.string().parse(1))).rejects.toBeInstanceOf(z.ZodError);
        });

        it('treats transport failures as unacknowledged without echoing them', async () => {
            await expect(attemptWrite('x', 'update', () => Promise.reject(new Error('socket hang up with payload secret')))).resolves.toEqual({
                acknowledged: false,
            });
        });
    });

    describe('pollVerification', () => {
        it('verifies presence and field equality', async () => {
            const result = await pollVerification(async () => ({ name: 'a', extra: 1 }), { name: 'a' }, true, fast);
            expect(result).toEqual({ status: 'verified', attempts: 1, differences: [] });
        });

        it('retries a mismatch until the bound, then reports it', async () => {
            const read = vi.fn(async () => ({ name: 'old' }));
            const result = await pollVerification(read, { name: 'new' }, true, { attempts: 2, delayMs: 1 });
            expect(read).toHaveBeenCalledTimes(2);
            expect(result).toMatchObject({ status: 'mismatch', attempts: 2, differences: [{ path: 'name', reason: 'different' }] });
        });

        it('returns unverifiable when requested fields are not readable', async () => {
            const result = await pollVerification(async () => ({ other: 1 }), { secret: 'x' }, true, fast);
            expect(result.status).toBe('unverifiable');
        });

        it('reports an absent record and failed reads as unknown', async () => {
            expect((await pollVerification(async () => undefined, { a: 1 }, true, fast)).reason).toBe('The record is not visible in the readback.');
            const failing = await pollVerification(() => Promise.reject(new Error('boom')), { a: 1 }, true, fast);
            expect(failing).toMatchObject({ status: 'unknown', reason: 'Readback failed; current state is unknown.' });
        });

        it('verifies absence for deletions and reports lingering records', async () => {
            expect((await pollVerification(async () => undefined, undefined, true, fast)).status).toBe('verified');
            expect(await pollVerification(async () => ({ id: 'a' }), undefined, true, fast)).toMatchObject({
                status: 'mismatch',
                reason: 'The record is still present.',
            });
        });

        it('keeps an unacknowledged write unknown when fields are unreadable (S2)', async () => {
            const result = await pollVerification(async () => ({ name: 'n' }), { name: 'n', status: true }, false, fast);
            expect(result).toMatchObject({ status: 'unknown', attempts: 1 });
        });

        it('downgrades an unacknowledged, unconfirmed write to unknown', async () => {
            const result = await pollVerification(async () => ({ name: 'old' }), { name: 'new' }, false, fast);
            expect(result.status).toBe('unknown');
            expect(result.reason).toContain('not acknowledged');
            // A write that landed despite a lost response is still verified.
            expect((await pollVerification(async () => ({ name: 'new' }), { name: 'new' }, false, fast)).status).toBe('verified');
        });
    });

    describe('runCreate', () => {
        const spec = (list: () => Promise<unknown>) => ({ label: 'static route', list });

        it('previews without writing and refuses duplicate names', async () => {
            const write = vi.fn();
            await expect(
                runCreate({ spec: spec(snapshots([{ id: 'a', name: 'r' }])), payload: { name: 'n' }, dryRun: true, write })
            ).resolves.toEqual({
                accepted: true,
                dryRun: true,
                planned: { name: 'n' },
                existingCount: 1,
            });
            await expect(
                runCreate({ spec: spec(snapshots([{ id: 'a', name: 'n' }])), payload: { name: 'n' }, dryRun: false, write })
            ).rejects.toThrow('A static route named "n" already exists (a).');
            expect(write).not.toHaveBeenCalled();
        });

        it('applies once, finds the new record and verifies requested fields', async () => {
            const write = vi.fn(async () => ({ id: 'b' }));
            const result = await runCreate({
                spec: {
                    ...spec(
                        snapshots(
                            [{ id: 'a', name: 'x' }],
                            [
                                { id: 'a', name: 'x' },
                                { id: 'b', name: 'n', metric: 1, secret: '***' },
                            ]
                        )
                    ),
                    writeOnly: ['secret'],
                },
                payload: { name: 'n', metric: 1, secret: 'pw' },
                dryRun: false,
                write,
                warnings: ['careful'],
                verify: fast,
            });
            expect(write).toHaveBeenCalledTimes(1);
            expect(result).toMatchObject({
                writeAcknowledged: true,
                applied: { id: 'b' },
                createdId: 'b',
                verification: { status: 'verified' },
                notVerifiedFields: ['secret'],
                warnings: ['careful'],
            });
        });

        it('normalizes read records onto the request shape before comparing', async () => {
            const result = await runCreate({
                spec: {
                    ...spec(snapshots([], [{ id: 'n1', name: 'n', updateInterval: 6 }])),
                    normalize: (record) => ({ ...record, interval: { updateInterval: record.updateInterval } }),
                },
                payload: { name: 'n', interval: { updateInterval: 6 } },
                dryRun: false,
                write: async () => ({}),
                verify: fast,
            });
            expect(result.verification).toMatchObject({ status: 'verified' });
        });

        it('verifies against the full detail when collection rows are summaries', async () => {
            const detail = vi.fn(async (id: string) => ({ id, name: 'n', vlanId: 50 }));
            const result = await runCreate({
                spec: { ...spec(snapshots([], [{ id: 'n1', name: 'n' }])), detail },
                payload: { name: 'n', vlanId: 50 },
                dryRun: false,
                write: async () => ({}),
                verify: fast,
            });
            expect(detail).toHaveBeenCalledWith('n1');
            expect(result.verification).toMatchObject({ status: 'verified' });
        });

        it('treats a malformed detail read as unknown', async () => {
            const result = await runCreate({
                spec: { ...spec(snapshots([], [{ id: 'n1', name: 'n' }])), detail: async () => 'oops', normalize: (r) => r },
                payload: { name: 'n' },
                dryRun: false,
                write: async () => ({}),
                verify: fast,
            });
            expect(result.verification).toMatchObject({ status: 'unknown' });
        });

        it('reports ambiguity when several new records match', async () => {
            const result = await runCreate({
                spec: { ...spec(snapshots([], [{ id: 'a' }, { id: 'b' }])), nameKey: null },
                payload: { metric: 1 },
                dryRun: false,
                write: async () => ({}),
                verify: fast,
            });
            expect(result.verification).toMatchObject({ status: 'unknown', reason: 'Readback failed; current state is unknown.' });
        });
    });

    describe('runUpdate', () => {
        const records = [
            { id: 'a', name: 'one', metric: 1 },
            { id: 'b', name: 'two', metric: 2 },
        ];

        it('requires an existing id and refuses renaming onto another record', async () => {
            const write = vi.fn();
            await expect(
                runUpdate({ spec: { label: 'route', list: snapshots(records) }, id: 'zz', payload: {}, dryRun: true, write })
            ).rejects.toThrow('No route with id "zz" exists.');
            await expect(
                runUpdate({ spec: { label: 'route', list: snapshots(records) }, id: 'a', payload: { name: 'two' }, dryRun: false, write })
            ).rejects.toThrow('A route named "two" already exists (b).');
            expect(write).not.toHaveBeenCalled();
        });

        it('previews the difference against the current record', async () => {
            const result = await runUpdate({
                spec: { label: 'route', list: snapshots(records) },
                id: 'a',
                payload: { metric: 5 },
                dryRun: true,
                write: vi.fn(),
            });
            expect(result).toMatchObject({
                dryRun: true,
                before: records[0],
                alreadyMatches: false,
                differences: [{ path: 'metric', reason: 'different' }],
            });
        });

        it('skips the write when the record already matches', async () => {
            const write = vi.fn();
            const result = await runUpdate({
                spec: { label: 'route', list: snapshots(records) },
                id: 'a',
                payload: { metric: 1 },
                dryRun: false,
                write,
            });
            expect(write).not.toHaveBeenCalled();
            expect(result).toMatchObject({ noOp: true, verification: { status: 'verified', attempts: 0 } });
        });

        it('previews and verifies updates against the normalized detail', async () => {
            let vlanId = 10;
            const spec = {
                label: 'SSID',
                list: snapshots([{ id: 'a', name: 'one' }]),
                detail: vi.fn(async () => ({ id: 'a', name: 'one', vlan: vlanId })),
                normalize: (record: Record<string, unknown>) => ({ ...record, vlanId: record.vlan }),
            };
            const preview = await runUpdate({ spec, id: 'a', payload: { vlanId: 20 }, dryRun: true, write: vi.fn() });
            expect(preview).toMatchObject({ before: { vlanId: 10 }, differences: [{ path: 'vlanId', reason: 'different' }] });
            const write = vi.fn(() => {
                vlanId = 20;
                return Promise.resolve();
            });
            await expect(runUpdate({ spec, id: 'a', payload: { vlanId: 20 }, dryRun: false, write, verify: fast })).resolves.toMatchObject({
                verification: { status: 'verified' },
            });
        });

        it('always writes when write-only fields are requested, and verifies the rest', async () => {
            const write = vi.fn(async () => undefined);
            const result = await runUpdate({
                spec: { label: 'route', list: snapshots(records, [{ id: 'a', name: 'one', metric: 1 }]), writeOnly: ['secret'] },
                id: 'a',
                payload: { metric: 1, secret: 'x' },
                dryRun: false,
                write,
                warnings: ['w'],
                verify: fast,
            });
            expect(write).toHaveBeenCalledTimes(1);
            expect(result).toMatchObject({ noOp: false, verification: { status: 'verified' }, notVerifiedFields: ['secret'], warnings: ['w'] });
        });
    });

    describe('unacknowledged writes with write-only fields (S1)', () => {
        const timeout = () => Promise.reject(new Error('timeout'));

        it('does not report a secret update as verified', async () => {
            const result = await runUpdate({
                spec: { label: 'DDNS entry', list: snapshots([{ id: 'a', name: 'n' }]), writeOnly: ['password'] },
                id: 'a',
                payload: { name: 'n', password: 'new' },
                dryRun: false,
                write: timeout,
                verify: fast,
            });
            expect(result).toMatchObject({ writeAcknowledged: false, verification: { status: 'unknown' } });
            expect((result.verification as { reason: string }).reason).toContain('write-only fields (password)');
        });

        it('does not report a secret settings change as verified', async () => {
            const result = await runSettings({
                label: 'SNMP',
                read: async () => ({ snmpV1V2CEnable: true }),
                payload: { snmpV1V2CEnable: true, communityString: 'new' },
                writeOnly: ['communityString'],
                dryRun: false,
                write: timeout,
                verify: fast,
            });
            expect(result).toMatchObject({ writeAcknowledged: false, verification: { status: 'unknown' } });
        });

        it('still verifies acknowledged secret updates by their readable fields', async () => {
            const result = await runUpdate({
                spec: { label: 'DDNS entry', list: snapshots([{ id: 'a', name: 'n' }]), writeOnly: ['password'] },
                id: 'a',
                payload: { name: 'n', password: 'new' },
                dryRun: false,
                write: () => Promise.resolve(),
                verify: fast,
            });
            expect(result).toMatchObject({ writeAcknowledged: true, verification: { status: 'verified' }, notVerifiedFields: ['password'] });
        });
    });

    describe('runDelete', () => {
        it('runs the guard before previewing', async () => {
            const guard = vi.fn(() => {
                throw new Error('protected');
            });
            await expect(
                runDelete({ spec: { label: 'x', list: snapshots([{ id: 'a' }]) }, id: 'a', dryRun: true, write: vi.fn(), guard })
            ).rejects.toThrow('protected');
        });

        it('previews the record, then deletes and verifies absence', async () => {
            const preview = await runDelete({
                spec: { label: 'x', list: snapshots([{ id: 'a' }]) },
                id: 'a',
                dryRun: true,
                write: vi.fn(),
                warnings: ['w'],
            });
            expect(preview).toEqual({ accepted: true, dryRun: true, id: 'a', before: { id: 'a' }, warnings: ['w'] });

            const write = vi.fn(async () => undefined);
            const result = await runDelete({ spec: { label: 'x', list: snapshots([{ id: 'a' }], []) }, id: 'a', dryRun: false, write, verify: fast });
            expect(result).toMatchObject({ writeAcknowledged: true, verification: { status: 'verified' } });
        });

        it('fails on an unknown id', async () => {
            await expect(runDelete({ spec: { label: 'x', list: snapshots([]) }, id: 'a', dryRun: true, write: vi.fn() })).rejects.toThrow(
                'No x with id "a"'
            );
        });
    });

    describe('runSettings', () => {
        it('rejects non-object settings reads', async () => {
            await expect(runSettings({ label: 'UPnP', read: async () => [], payload: {}, dryRun: true, write: vi.fn() })).rejects.toThrow(
                'unexpected UPnP settings'
            );
        });

        it('previews, skips no-ops and verifies applied settings', async () => {
            const preview = await runSettings({
                label: 'UPnP',
                read: async () => ({ enable: false }),
                payload: { enable: true },
                dryRun: true,
                write: vi.fn(),
            });
            expect(preview).toMatchObject({ dryRun: true, alreadyMatches: false, before: { enable: false } });

            const write = vi.fn();
            const noop = await runSettings({ label: 'UPnP', read: async () => ({ enable: true }), payload: { enable: true }, dryRun: false, write });
            expect(noop).toMatchObject({ noOp: true });
            expect(write).not.toHaveBeenCalled();

            const read = snapshots({ enable: false }, { enable: true });
            const applied = await runSettings({
                label: 'UPnP',
                read: read as () => Promise<unknown>,
                payload: { enable: true, password: 'x' },
                writeOnly: ['password'],
                dryRun: false,
                write: async () => 'ok',
                warnings: ['w'],
                verify: fast,
            });
            expect(applied).toMatchObject({
                writeAcknowledged: true,
                applied: 'ok',
                verification: { status: 'verified' },
                notVerifiedFields: ['password'],
            });
        });
    });

    describe('runAction', () => {
        it('previews the preflight evidence without writing', async () => {
            const write = vi.fn();
            const result = await runAction({ label: 'locate', dryRun: true, preflight: async () => ({ mac: 'm' }), write, warnings: ['w'] });
            expect(result).toEqual({ accepted: true, dryRun: true, target: { mac: 'm' }, warnings: ['w'] });
            expect(write).not.toHaveBeenCalled();
        });

        it('reports submitted and unacknowledged outcomes', async () => {
            const ok = await runAction({ label: 'locate', dryRun: false, preflight: async () => ({}), write: async () => 'done' });
            expect(ok).toEqual({ writeAcknowledged: true, applied: 'done', target: {} });
            const lost = await runAction({
                label: 'locate',
                dryRun: false,
                preflight: async () => ({}),
                write: () => Promise.reject(new Error('timeout')),
            });
            expect(lost).toMatchObject({ writeAcknowledged: false, verification: { status: 'unknown' } });
        });
    });
});

describe('tools/resourceMutationShared MAC helpers', async () => {
    const { normalizeMac, pick, requireByMac } = await import('../../src/tools/resourceMutationShared.js');

    it('matches MACs regardless of separator and case', () => {
        expect(normalizeMac('aa:bb:cc:dd:ee:ff')).toBe('AABBCCDDEEFF');
        expect(requireByMac([{ mac: 'AA-BB-CC-DD-EE-FF', name: 'ap' }], 'aa:bb:cc:dd:ee:ff', 'device')).toEqual({
            mac: 'AA-BB-CC-DD-EE-FF',
            name: 'ap',
        });
        expect(() => requireByMac([{ mac: 'AA-BB-CC-DD-EE-00' }, { name: 'no-mac' }], 'AA-BB-CC-DD-EE-FF', 'device')).toThrow(
            'No device with MAC AA-BB-CC-DD-EE-FF exists in this site.'
        );
    });

    it('picks only present fields', () => {
        expect(pick({ a: 1, b: undefined, c: 3 }, ['a', 'b'])).toEqual({ a: 1 });
    });
});
