import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetUrlFilterGeneralTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUrlFilterGeneral',
        {
            description:
                'Get the URL filter global setting, including whether URL filtering is enabled and the default action for unmatched requests.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getUrlFilterGeneral', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getUrlFilterGeneral(siteId, customHeaders))
        )
    );
}
