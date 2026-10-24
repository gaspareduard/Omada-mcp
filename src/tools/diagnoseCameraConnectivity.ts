import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { diagnosticCompleteness, readDiagnosticSection } from '../utils/diagnostics.js';

export function registerDiagnoseCameraConnectivityTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'diagnoseCameraConnectivity',
        {
            description:
                'Read-only camera network evidence by IP, hostname or MAC: current connection, VLAN/signal details and recent sessions. Does not test video decoding/inference or power-cycle a camera.',
            inputSchema: siteInputSchema.extend({ identifier: z.string().trim().min(1) }).shape,
        },
        wrapToolHandler('diagnoseCameraConnectivity', async ({ identifier, siteId, customHeaders }) => {
            const resolvedSiteId = await client.resolveSiteId(siteId);
            const current = await readDiagnosticSection(() => client.getClient(identifier, resolvedSiteId, customHeaders));
            const candidate = current.data && typeof current.data === 'object' ? (current.data as Record<string, unknown>).mac : undefined;
            const mac = typeof candidate === 'string' ? candidate : /^([a-f\d]{2}[:-]){5}[a-f\d]{2}$/i.test(identifier) ? identifier : undefined;
            const [detail, sessions] = await Promise.all([
                readDiagnosticSection(async () => {
                    if (!mac) throw new Error('Client MAC could not be resolved. An offline client may require its MAC explicitly.');
                    return await client.getClientDetail(mac, resolvedSiteId, customHeaders);
                }),
                readDiagnosticSection(() =>
                    client.listClientsPastConnections({ siteId: resolvedSiteId, page: 1, pageSize: 20, searchKey: mac ?? identifier }, customHeaders)
                ),
            ]);
            const sections = { current, detail, sessions };
            return toToolResult({
                siteId: resolvedSiteId,
                resolvedMac: mac ?? null,
                ...diagnosticCompleteness(sections),
                sections,
                historyComplete: false,
                historyLimit: 20,
                nextChecks: [
                    'Inspect attachment, VLAN and signal fields in detail.',
                    'Compare session drops with AP/switch events using diagnoseLogs.',
                    'Inspect the attached switch port/PoE or AP uplink when the controller identifies it.',
                ],
                limitation:
                    'Network evidence cannot determine Frigate inference health or prove that an RTSP stream decodes. Missing attachment or PoE fields remain unknown.',
            });
        })
    );
}
