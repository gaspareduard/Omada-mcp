import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { diagnosticCompleteness, pageObservation, readDiagnosticSection } from '../utils/diagnostics.js';

export function registerDiagnoseLogsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'diagnoseLogs',
        {
            description:
                'Compare first-page events, alerts, audit logs and logging configuration for one site and time window. Empty results and access failures are distinct; logging settings are never changed.',
            inputSchema: siteInputSchema.extend({ windowHours: z.number().int().min(1).max(168).default(24) }).shape,
        },
        wrapToolHandler('diagnoseLogs', async ({ siteId, customHeaders, windowHours }) => {
            const resolvedSiteId = await client.resolveSiteId(siteId);
            const endTime = Date.now();
            const startTime = endTime - windowHours * 3600000;
            const query = { page: 1, pageSize: 20, startTime, endTime };
            const [events, alerts, audit, loggingSettings, auditSettings] = await Promise.all([
                readDiagnosticSection(() => client.listSiteEvents(query, resolvedSiteId, customHeaders)),
                readDiagnosticSection(() => client.listSiteAlerts(query, resolvedSiteId, customHeaders)),
                readDiagnosticSection(() => client.listSiteAuditLogs(query, resolvedSiteId, customHeaders)),
                readDiagnosticSection(() => client.getLogSettingForSite(resolvedSiteId, customHeaders)),
                readDiagnosticSection(() => client.getAuditLogSettingForSite(resolvedSiteId, customHeaders)),
            ]);
            const sections = { events, alerts, audit, loggingSettings, auditSettings };
            return toToolResult({
                siteId: resolvedSiteId,
                window: { startTime, endTime, unit: 'unix-milliseconds', timezone: 'UTC', appliesTo: ['events', 'alerts', 'audit'] },
                ...diagnosticCompleteness(sections),
                inventoryComplete: false,
                pageLimit: 20,
                sections,
                observations: { events: pageObservation(events), alerts: pageObservation(alerts), audit: pageObservation(audit) },
                limitation:
                    'Logging settings are current snapshots, not historical settings for this window. Configuration and permissions must be interpreted alongside each result. No returned events is not proof of a quiet or healthy network.',
            });
        })
    );
}
