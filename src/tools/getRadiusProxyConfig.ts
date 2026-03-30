import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    customHeaders: customHeadersSchema.describe(
        'Optional HTTP headers to include in the Omada API request (e.g. {"X-Custom-Header": "value"}). Rarely needed.'
    ),
});

export function registerGetRadiusProxyConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRadiusProxyConfig',
        {
            description: 'Get the global RADIUS proxy configuration from the controller, including proxy enabled state and server settings.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getRadiusProxyConfig', async ({ customHeaders }) => toToolResult(await client.getRadiusProxyConfig(customHeaders)))
    );
}
