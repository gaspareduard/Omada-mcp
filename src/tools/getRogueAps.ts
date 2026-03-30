import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRogueApsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRogueAps',
        {
            description: 'Get the list of rogue (unauthorized) access points detected by WIDS in a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getRogueAps', async ({ siteId, customHeaders }) => toToolResult(await client.getRogueAps(siteId, customHeaders)))
    );
}
