import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRoleDetailTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        roleId: z.string().min(1).describe('The ID of the role to retrieve details for.'),
        customHeaders: customHeadersSchema,
    });
    server.registerTool(
        'getRoleDetail',
        {
            description: 'Get detailed information about a specific user role, including its permissions.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRoleDetail', async ({ roleId, customHeaders }) => toToolResult(await client.getRoleDetail(roleId, customHeaders)))
    );
}
