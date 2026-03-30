import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetQosPolicyRuleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getQosPolicyRule',
        {
            description: '[DEPRECATED] Get gateway QoS policy settings. This is an alias for getQosPolicy — use getQosPolicy instead.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getQosPolicyRule', async ({ siteId, customHeaders }) => toToolResult(await client.getQosPolicy(siteId, customHeaders)))
    );
}
