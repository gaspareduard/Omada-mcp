import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { stackIdSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSwitchStackDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSwitchStackDetail',
        {
            description: 'Fetch detailed information for a specific switch stack.',
            inputSchema: stackIdSchema.shape,
        },
        wrapToolHandler('getSwitchStackDetail', async ({ stackId, siteId, customHeaders }) =>
            toToolResult(await client.getSwitchStackDetail(stackId, siteId, customHeaders))
        )
    );
}
