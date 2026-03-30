import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRemoteLoggingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRemoteLogging',
        {
            description: 'Get the global syslog/remote logging configuration, including syslog server address and log level.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getRemoteLogging', async ({ customHeaders }) => toToolResult(await client.getRemoteLogging(customHeaders)))
    );
}
