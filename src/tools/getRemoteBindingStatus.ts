import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRemoteBindingStatusTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getRemoteBindingStatus',
        {
            description: 'Get the remote binding status between the controller and cloud service.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRemoteBindingStatus', async ({ customHeaders }) => toToolResult(await client.getRemoteBindingStatus(customHeaders)))
    );
}
