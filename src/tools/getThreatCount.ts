import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetThreatCountTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        startTime: z.number().int().describe('Start of the time range as Unix epoch seconds (e.g. 1682000000).'),
        endTime: z.number().int().describe('End of the time range as Unix epoch seconds (e.g. 1682086400).'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getThreatCount',
        {
            description:
                'Get the global threat count grouped by severity level (critical, high, medium, low) within a time range. Provides a summary view of the current threat landscape across all sites. Requires startTime and endTime as Unix epoch seconds.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getThreatCount', async ({ startTime, endTime, customHeaders }) =>
            toToolResult(await client.getThreatSeverity(startTime, endTime, customHeaders))
        )
    );
}
