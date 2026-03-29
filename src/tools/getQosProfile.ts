import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetQosProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getQosProfile',
        {
            description: 'Get rate limit profiles for a site, listing bandwidth limit configurations that can be applied to clients.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getQosProfile', async ({ siteId, customHeaders }) => toToolResult(await client.getRateLimitProfiles(siteId, customHeaders)))
    );
}
