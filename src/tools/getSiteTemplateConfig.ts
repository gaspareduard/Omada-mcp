import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteTemplateConfigTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteTemplateId: z.string().min(1).describe('The ID of the site template to retrieve configuration for.'),
        customHeaders: customHeadersSchema,
    });
    server.registerTool(
        'getSiteTemplateConfig',
        {
            description: 'Get the configuration settings for a specific site template.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSiteTemplateConfig', async ({ siteTemplateId, customHeaders }) =>
            toToolResult(await client.getSiteTemplateConfig(siteTemplateId, customHeaders))
        )
    );
}
