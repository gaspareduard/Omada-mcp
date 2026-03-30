import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetMulticastRateLimitTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMulticastRateLimit',
        {
            description: 'Get multicast rate limit settings for a site, controlling multicast traffic rates on the wireless network.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getMulticastRateLimit', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getMulticastRateLimit(siteId, customHeaders))
        )
    );
}
