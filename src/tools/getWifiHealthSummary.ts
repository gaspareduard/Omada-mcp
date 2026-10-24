import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { diagnosticCompleteness, readDiagnosticSection, wifiFindings } from '../utils/diagnostics.js';

export function registerGetWifiHealthSummaryTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWifiHealthSummary',
        {
            description:
                'Read-only Wi-Fi diagnostic evidence: dashboard, channels, interference and retry/drop history. Missing evidence stays unknown; no scan or radio change is initiated.',
            inputSchema: siteInputSchema.extend({ windowMinutes: z.number().int().min(1).max(1440).default(60) }).shape,
        },
        wrapToolHandler('getWifiHealthSummary', async ({ siteId, customHeaders, windowMinutes }) => {
            const resolvedSiteId = await client.resolveSiteId(siteId);
            const end = Math.floor(Date.now() / 1000);
            const start = end - windowMinutes * 60;
            const [dashboard, channels, interference, retries] = await Promise.all([
                readDiagnosticSection(() => client.getDashboardWifiSummary(resolvedSiteId, customHeaders, { start, end })),
                readDiagnosticSection(() => client.getChannels(resolvedSiteId, customHeaders)),
                readDiagnosticSection(() => client.getInterference(resolvedSiteId, customHeaders)),
                readDiagnosticSection(() => client.getRetryAndDroppedRate(resolvedSiteId, start, end, customHeaders)),
            ]);
            const sections = { dashboard, channels, interference, retries };
            return toToolResult({
                siteId: resolvedSiteId,
                window: { start, end, unit: 'unix-seconds', appliesTo: ['dashboard', 'retries'] },
                ...diagnosticCompleteness(sections),
                sections,
                findings: wifiFindings(sections),
                findingLimit: 10,
                findingPolicy: 'Heuristics for review, not a health score. No findings does not establish healthy Wi-Fi.',
                interpretation: [
                    'The requested window applies to dashboard and retry history. Channels and interference use controller-defined observation windows.',
                    'Busy airtime or retries can have several causes. Correlate signal, traffic and uplink evidence before attributing interference.',
                    'A channel change alone does not establish radar; confirm with controller events.',
                ],
                nextTools: ['diagnoseClient', 'getApRadios', 'getSitesApsAvailableChannel', 'diagnoseLogs'],
            });
        })
    );
}
