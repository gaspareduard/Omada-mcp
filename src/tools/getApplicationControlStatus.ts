import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetApplicationControlStatusTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApplicationControlStatus',
        {
            description: 'Get application control (DPI) status and configuration for a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getApplicationControlStatus', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getApplicationControlStatus(siteId, customHeaders))
        )
    );
}
