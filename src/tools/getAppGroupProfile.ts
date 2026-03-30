import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAppGroupProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAppGroupProfile',
        {
            description:
                '[DEPRECATED] Get MAC group profiles for a site. This is an alias for getGroupPolicyDetail with groupType="2" — use getGroupPolicyDetail instead.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getAppGroupProfile', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getGroupProfilesByType('2', siteId, customHeaders))
        )
    );
}
