import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDeviceAccessManagementTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDeviceAccessManagement',
        {
            description: 'Get the device access management settings, controlling which devices can be managed.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getDeviceAccessManagement', async ({ customHeaders }) => toToolResult(await client.getDeviceAccessManagement(customHeaders)))
    );
}
