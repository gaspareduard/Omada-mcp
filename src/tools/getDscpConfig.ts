import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDscpConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDscpConfig',
        {
            description:
                '[DEPRECATED] Get DSCP/QoS tag outbound traffic configuration. This is an alias for getQosPolicy — use getQosPolicy instead.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getDscpConfig', async ({ siteId, customHeaders }) => toToolResult(await client.getQosPolicy(siteId, customHeaders)))
    );
}
