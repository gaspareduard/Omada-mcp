import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetPortalPortTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getPortalPort',
        {
            description: 'Get the portal port configuration for the controller web interface.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getPortalPort', async ({ customHeaders }) => toToolResult(await client.getPortalPort(customHeaders)))
    );
}
