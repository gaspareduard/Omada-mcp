import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAllUsersAppTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getAllUsersApp',
        {
            description: 'Get all users (both cloud and local) in a grid/app view format.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getAllUsersApp', async ({ customHeaders }) => toToolResult(await client.getAllUsersApp(customHeaders)))
    );
}
