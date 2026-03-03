import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRateLimitProfilesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRateLimitProfiles',
        {
            description:
                'Get the list of available rate limit profiles for a site. These profiles can be applied to clients to control their bandwidth usage.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getRateLimitProfiles', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getRateLimitProfiles(siteId, customHeaders))
        )
    );
}
