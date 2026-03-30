import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = siteInputSchema.extend({
    start: z
        .number()
        .int()
        .positive()
        .describe(
            'Start of the time range as a Unix timestamp in seconds (e.g. Math.floor(Date.now() / 1000) - 3600 for the last hour). Must be paired with end.'
        ),
    end: z
        .number()
        .int()
        .positive()
        .describe('End of the time range as a Unix timestamp in seconds (e.g. Math.floor(Date.now() / 1000)). Must be paired with start.'),
});

export function registerGetIspLoadTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getIspLoad',
        {
            description:
                'Get per-WAN ISP link load over a time range. Shows traffic volume and utilization per internet uplink. Useful for understanding load balancing behaviour, identifying saturated WAN links, and analysing failover events. start and end are Unix timestamps in seconds.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getIspLoad', async ({ siteId, start, end, customHeaders }) =>
            toToolResult(await client.getIspLoad(siteId, start, end, customHeaders))
        )
    );
}
