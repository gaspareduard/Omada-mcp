import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    customHeaders: customHeadersSchema.describe(
        'Optional HTTP headers to include in the Omada API request (e.g. {"X-Custom-Header": "value"}). Rarely needed.'
    ),
});

export function registerGetUserRoleProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUserRoleProfile',
        {
            description: 'Get user role profiles from the controller, listing defined roles with associated permissions for administrator accounts.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getUserRoleProfile', async ({ customHeaders }) => toToolResult(await client.getUserRoleProfile(customHeaders)))
    );
}
