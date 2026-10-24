import { describe, expect, it } from 'vitest';
import { diagnosticCompleteness, pageObservation, readDiagnosticSection, wifiFindings } from '../../src/utils/diagnostics.js';

describe('diagnostic evidence', () => {
    it('preserves success data and redacts named secrets', async () => {
        expect(await readDiagnosticSection(async () => ({ password: 'hidden', value: 1 }))).toMatchObject({
            status: 'ok',
            data: { password: '********', value: 1 },
        });
    });
    it('keeps unavailable evidence distinct from an empty observation', async () => {
        const section = await readDiagnosticSection(() => {
            throw new Error('denied');
        });
        expect(section).toMatchObject({ status: 'unavailable', error: 'denied' });
        expect(diagnosticCompleteness({ section })).toEqual({ complete: false, missing: ['section'] });
        expect(pageObservation(section)).toContain('no conclusion');
        expect(
            await readDiagnosticSection(() => {
                throw 'offline';
            })
        ).toMatchObject({ error: 'offline' });
        expect(diagnosticCompleteness({})).toEqual({ complete: true, missing: [] });
    });
    it('distinguishes unknown shapes, conflicting totals, empty windows and first-page limits', () => {
        const section = (data: unknown) => ({ status: 'ok' as const, observedAt: '', data });
        expect(pageObservation(section(null))).toContain('Unexpected');
        expect(pageObservation(section({}))).toContain('Unexpected');
        expect(pageObservation(section({ data: [], totalRows: 4 }))).toContain('conflicts');
        expect(pageObservation(section({ data: [] }))).toContain('does not prove');
        expect(pageObservation(section({ data: [1], totalRows: 3 }))).toContain('1 records in the first page of 3');
        expect(pageObservation(section({ data: [1] }))).toContain('total unknown');
    });
    it('uses documented percentage fields and labels heuristics without declaring health', () => {
        expect(wifiFindings({})).toEqual([]);
        const section = (data: unknown) => ({ status: 'ok' as const, observedAt: '', data });
        expect(wifiFindings({ dashboard: section({ channelUtilization: null }) })).toEqual([]);
        expect(wifiFindings({ dashboard: section({ channelUtilization: 101 }) })).toEqual([]);
        expect(wifiFindings({ interference: section({ apInterference2g: [null, {}, { interUtil: 2 }] }) })).toEqual([]);
        const result = wifiFindings({
            dashboard: section({ channelUtilization: 80 }),
            interference: section({ apInterference2g: [{ mac: 'ap', interUtil: 25 }] }),
        });
        expect(result).toHaveLength(2);
        expect(result[0].evidence).toMatchObject({ unit: 'percent', reviewThreshold: 70 });
        expect(result[1].evidence).toMatchObject({ apMac: 'ap', reviewThreshold: 20 });
    });
});
