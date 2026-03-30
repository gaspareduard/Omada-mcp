import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetTopThreatsTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'getTopThreats',
        {
            description: 'Get the top threats from the global threat management view across all sites.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getTopThreats', async ({ customHeaders }) => toToolResult(await client.getTopThreats(customHeaders)))
    );
}
