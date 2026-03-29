import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetQosPolicyTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getQosPolicy',
        {
            description: 'Get the gateway QoS policy (tag outbound traffic settings) for a site, including DSCP marking rules for outbound traffic.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getQosPolicy', async ({ siteId, customHeaders }) => toToolResult(await client.getQosPolicy(siteId, customHeaders)))
    );
}
