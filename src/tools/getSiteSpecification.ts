import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSiteSpecificationTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSiteSpecification',
        {
            description: 'Get site specification including device limits, feature capabilities, and hardware constraints.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSiteSpecification', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getSiteSpecification(siteId, customHeaders))
        )
    );
}
