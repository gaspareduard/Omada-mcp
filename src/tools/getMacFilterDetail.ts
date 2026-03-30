import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetMacFilterDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMacFilterDetail',
        {
            description:
                'Get the MAC filtering global settings for a site, including whether MAC filtering is enabled and the default action for unmatched clients.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getMacFilterDetail', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getMacFilteringGeneralSetting(siteId, customHeaders))
        )
    );
}
