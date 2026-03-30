import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetQosMarkingRuleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getQosMarkingRule',
        {
            description:
                '[DEPRECATED] Get gateway QoS marking (tag outbound traffic) settings. This is an alias for getQosPolicy — use getQosPolicy instead.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getQosMarkingRule', async ({ siteId, customHeaders }) => toToolResult(await client.getQosPolicy(siteId, customHeaders)))
    );
}
