import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAllLocalUsersTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getAllLocalUsers',
        {
            description: 'Get all local users configured on the controller, excluding the root account.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getAllLocalUsers', async ({ customHeaders }) => toToolResult(await client.getAllLocalUsers(customHeaders)))
    );
}
