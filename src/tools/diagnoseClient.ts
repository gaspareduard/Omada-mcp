import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    identifier: z
        .string()
        .min(1)
        .describe('Client MAC address, IP address, or hostname to look up. MAC format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX.'),
    siteId: z.string().optional().describe('Optional site ID. Uses default site if omitted.'),
    customHeaders: customHeadersSchema,
});

export function registerDiagnoseClientTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'diagnoseClient',
        {
            description:
                "Composite client diagnostic — single call that combines a client's current connection status, detailed info (VLAN, signal, rate limit, group policy), and recent connection history (last 10 sessions). Use when troubleshooting why a device can't connect, has poor performance, or keeps disconnecting. Accepts MAC address, IP address, or hostname.",
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('diagnoseClient', async ({ identifier, siteId, customHeaders }) => {
            // Step 1: resolve the client to get its MAC address
            const currentClient = await client.getClient(identifier, siteId, customHeaders);

            // Extract MAC — needed for getClientDetail; fall back to identifier if it looks like a MAC
            const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
            const resolvedMac = (currentClient as { mac?: string } | undefined)?.mac ?? (macPattern.test(identifier) ? identifier : undefined);

            // Step 2: fetch detail + history in parallel (graceful degradation if MAC unknown)
            const [detail, history] = await Promise.allSettled([
                resolvedMac ? client.getClientDetail(resolvedMac, siteId, customHeaders) : Promise.resolve(null),
                client.listClientsPastConnections({ siteId, page: 1, pageSize: 10, searchKey: identifier }, customHeaders),
            ]);

            return toToolResult({
                currentStatus: currentClient ?? null,
                detail: detail.status === 'fulfilled' ? detail.value : { _error: String(detail.reason) },
                recentConnectionHistory: history.status === 'fulfilled' ? history.value : { _error: String(history.reason) },
                _resolvedMac: resolvedMac ?? null,
            });
        })
    );
}
