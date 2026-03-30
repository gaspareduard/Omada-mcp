import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAllRolesTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getAllRoles',
        {
            description: '[DEPRECATED] Use getUserRoleProfile instead. Same GET /roles endpoint. Get all user roles configured on the controller.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getAllRoles', async ({ customHeaders }) => toToolResult(await client.getAllRoles(customHeaders)))
    );
}
