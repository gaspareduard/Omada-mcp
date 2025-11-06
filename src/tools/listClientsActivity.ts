import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const clientActivityInputSchema = z.object({
    siteId: z.string().optional().describe('Optional site ID. If not provided, uses the default site from configuration.'),
    start: z.number().int().optional().describe('Optional start timestamp in seconds (e.g., 1682000000)'),
    end: z.number().int().optional().describe('Optional end timestamp in seconds (e.g., 1682000000)'),
});

export function registerListClientsActivityTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listClientsActivity',
        {
            description:
                'Get client activity statistics over time from the dashboard. Returns time-series data showing new, active, and disconnected clients (both wireless/EAP and wired/switch) for each time snapshot. Useful for monitoring client connection trends and activity patterns.',
            inputSchema: clientActivityInputSchema.shape,
        },
        wrapToolHandler('listClientsActivity', async ({ siteId, start, end }) =>
            toToolResult(await client.listClientsActivity({ siteId, start, end }))
        )
    );
}
