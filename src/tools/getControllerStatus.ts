import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetControllerStatusTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getControllerStatus',
        {
            description: 'Get the Omada controller health and status, including running state, uptime, and resource usage.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getControllerStatus', async ({ customHeaders }) => toToolResult(await client.getControllerStatus(customHeaders)))
    );
}
