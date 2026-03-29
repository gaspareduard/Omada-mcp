import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    page: z.number().int().min(1).default(1).describe('Page number (1-based).'),
    pageSize: z.number().int().min(1).max(1000).default(10).describe('Number of results per page (1–1000).'),
    ...siteInputSchema.shape,
});

export function registerGetGatewayQosClassRulesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGatewayQosClassRules',
        {
            description: 'Get the gateway QoS class rules for a site, including traffic classification rules and DSCP/priority markings.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getGatewayQosClassRules', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGatewayQosClassRules(page, pageSize, siteId, customHeaders))
        )
    );
}
