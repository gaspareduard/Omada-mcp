import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAvailableRolesTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getAvailableRoles',
        {
            description: 'Get the list of roles available for assignment to users.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getAvailableRoles', async ({ customHeaders }) => toToolResult(await client.getAvailableRoles(customHeaders)))
    );
}
