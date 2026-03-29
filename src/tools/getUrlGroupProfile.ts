import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetUrlGroupProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getUrlGroupProfile',
        {
            description:
                '[DEPRECATED] Get URL/IP port group profiles for a site. This is an alias for getGroupPolicyDetail with groupType="1" — use getGroupPolicyDetail instead.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getUrlGroupProfile', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getGroupProfilesByType('1', siteId, customHeaders))
        )
    );
}
