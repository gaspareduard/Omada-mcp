import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteTemplateListTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({ customHeaders: customHeadersSchema });
    server.registerTool(
        'getSiteTemplateList',
        {
            description: 'Get the list of all site templates configured on the controller.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSiteTemplateList', async ({ customHeaders }) => toToolResult(await client.getSiteTemplateList(customHeaders)))
    );
}
