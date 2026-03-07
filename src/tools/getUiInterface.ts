import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetUiInterfaceTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUiInterface',
        {
            description: 'Get the UI interface settings for the controller, including timeout and session options.',
            inputSchema: z.object({ customHeaders: customHeadersSchema }).shape,
        },
        wrapToolHandler('getUiInterface', async ({ customHeaders }) => toToolResult(await client.getUiInterface(customHeaders)))
    );
}
