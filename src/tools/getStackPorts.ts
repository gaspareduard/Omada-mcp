import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { stackIdSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetStackPortsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getStackPorts',
        {
            description: 'Get all port information for a switch stack.',
            inputSchema: stackIdSchema.shape,
        },
        wrapToolHandler('getStackPorts', async ({ stackId, siteId, customHeaders }) =>
            toToolResult(await client.getStackPorts(stackId, siteId, customHeaders))
        )
    );
}
