import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetControllerPortTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getControllerPort',
        {
            description: 'Get the controller port configuration used for device adoption and communication.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getControllerPort', async ({ customHeaders }) => toToolResult(await client.getControllerPort(customHeaders)))
    );
}
