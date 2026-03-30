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

export function registerGetTrafficDistributionTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getTrafficDistribution',
        {
            description:
                'Get traffic distribution by protocol and application type over a time range. Shows breakdown of traffic by category (video, gaming, web, etc.) helping identify what is consuming bandwidth on the network. start and end are Unix timestamps in seconds.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getTrafficDistribution', async ({ siteId, start, end, customHeaders }) =>
            toToolResult(await client.getTrafficDistribution(siteId, start, end, customHeaders))
        )
    );
}
