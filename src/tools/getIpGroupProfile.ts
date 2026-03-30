import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetIpGroupProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getIpGroupProfile',
        {
            description:
                '[DEPRECATED] Get IP group profiles for a site. This is an alias for getGroupPolicyDetail with groupType="0" — use getGroupPolicyDetail instead.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getIpGroupProfile', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getGroupProfilesByType('0', siteId, customHeaders))
        )
    );
}
