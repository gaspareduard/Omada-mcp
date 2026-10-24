import { redactSecrets } from './redact.js';

export interface DiagnosticSection {
    status: 'ok' | 'unavailable';
    observedAt: string;
    data?: unknown;
    error?: string;
}

/** A failed section is unknown, never an empty or healthy observation. */
export async function readDiagnosticSection(read: () => Promise<unknown>): Promise<DiagnosticSection> {
    try {
        return { status: 'ok', observedAt: new Date().toISOString(), data: redactSecrets(await read()) };
    } catch (error) {
        return { status: 'unavailable', observedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) };
    }
}

export function diagnosticCompleteness(sections: Record<string, DiagnosticSection>): { complete: boolean; missing: string[] } {
    const missing = Object.entries(sections)
        .filter(([, section]) => section.status !== 'ok')
        .map(([name]) => name);
    return { complete: missing.length === 0, missing };
}

export function pageObservation(section: DiagnosticSection): string {
    if (section.status !== 'ok') return 'Unavailable; no conclusion about event activity is possible.';
    const data = section.data;
    if (!data || typeof data !== 'object' || !Array.isArray((data as Record<string, unknown>).data))
        return 'Unexpected response shape; completeness is unknown.';
    const page = data as { data: unknown[]; totalRows?: number };
    if (page.data.length === 0)
        return page.totalRows && page.totalRows > 0
            ? 'Empty page conflicts with the advertised total; incomplete evidence.'
            : 'No records returned in this query window. This alone does not prove logging is enabled.';
    return `Returned ${page.data.length} records in the first page${typeof page.totalRows === 'number' ? ` of ${page.totalRows}` : '; total unknown'}.`;
}

export interface WifiFinding {
    kind: string;
    evidence: Record<string, unknown>;
    interpretation: string;
    nextTool: string;
}

/** Uses percentage fields documented in 07-monitor.json. Thresholds are review heuristics. */
export function wifiFindings(sections: Record<string, DiagnosticSection>): WifiFinding[] {
    const findings: WifiFinding[] = [];
    const dashboard = sections.dashboard?.data;
    if (dashboard && typeof dashboard === 'object') {
        const utilization = (dashboard as Record<string, unknown>).channelUtilization;
        if (typeof utilization === 'number' && utilization >= 70 && utilization <= 100) {
            findings.push({
                kind: 'busy-airtime',
                evidence: { field: 'channelUtilization', value: utilization, unit: 'percent', reviewThreshold: 70 },
                interpretation: 'Average airtime is busy. Check traffic demand and per-channel evidence; this alone does not identify interference.',
                nextTool: 'getChannels',
            });
        }
    }
    const interference = sections.interference?.data;
    if (interference && typeof interference === 'object') {
        for (const band of ['apInterference2g', 'apInterference5g', 'apInterference5g2', 'apInterference6g']) {
            const entries = (interference as Record<string, unknown>)[band];
            if (!Array.isArray(entries)) continue;
            for (const entry of entries) {
                if (!entry || typeof entry !== 'object') continue;
                const record = entry as Record<string, unknown>;
                if (typeof record.interUtil === 'number' && record.interUtil >= 20 && record.interUtil <= 100) {
                    findings.push({
                        kind: 'reported-interference',
                        evidence: { band, apMac: record.mac, value: record.interUtil, unit: 'percent', reviewThreshold: 20 },
                        interpretation:
                            'The controller reports elevated interference on this radio. Correlate retries and signal before changing its channel.',
                        nextTool: 'getApRadios',
                    });
                }
            }
        }
    }
    return findings.slice(0, 10);
}
