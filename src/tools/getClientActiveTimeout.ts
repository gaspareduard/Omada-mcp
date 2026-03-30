import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetClientActiveTimeoutTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getClientActiveTimeout',
        {
            description: 'Get the client inactivity timeout setting. Clients are marked inactive after this period of no traffic.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getClientActiveTimeout', async ({ customHeaders }) => toToolResult(await client.getClientActiveTimeout(customHeaders)))
    );
}
