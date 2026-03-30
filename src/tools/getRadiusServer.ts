import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRadiusServerTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRadiusServer',
        {
            description: 'Get the global RADIUS server configuration for the controller.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getRadiusServer', async ({ customHeaders }) => toToolResult(await client.getRadiusServer(customHeaders)))
    );
}
