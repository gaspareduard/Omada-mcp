import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetTrafficPriorityTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getTrafficPriority',
        {
            description:
                'Get the gateway VoIP and traffic prioritization settings for a site, including QoS prioritization rules for voice and real-time traffic.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getTrafficPriority', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getTrafficPriority(siteId, customHeaders))
        )
    );
}
