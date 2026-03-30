import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetMailServerStatusTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMailServerStatus',
        {
            description: 'Get the mail server connection status for the controller.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getMailServerStatus', async ({ customHeaders }) => toToolResult(await client.getMailServerStatus(customHeaders)))
    );
}
