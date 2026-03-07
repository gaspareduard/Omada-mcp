import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetLoggingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLogging',
        {
            description: 'Get the controller logging configuration, including log levels and storage settings.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getLogging', async ({ customHeaders }) => toToolResult(await client.getLogging(customHeaders)))
    );
}
