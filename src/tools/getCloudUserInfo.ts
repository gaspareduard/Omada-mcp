import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetCloudUserInfoTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getCloudUserInfo',
        {
            description: 'Get cloud user account information for the currently authenticated cloud user.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getCloudUserInfo', async ({ customHeaders }) => toToolResult(await client.getCloudUserInfo(customHeaders)))
    );
}
