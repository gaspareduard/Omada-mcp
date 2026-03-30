import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetCertificateTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getCertificate',
        {
            description: 'Get the SSL/TLS certificate configuration for the controller.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getCertificate', async ({ customHeaders }) => toToolResult(await client.getCertificate(customHeaders)))
    );
}
