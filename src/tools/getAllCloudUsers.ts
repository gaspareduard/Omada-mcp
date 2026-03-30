import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAllCloudUsersTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getAllCloudUsers',
        {
            description: 'Get all cloud users configured on the controller, excluding the root account.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getAllCloudUsers', async ({ customHeaders }) => toToolResult(await client.getAllCloudUsers(customHeaders)))
    );
}
