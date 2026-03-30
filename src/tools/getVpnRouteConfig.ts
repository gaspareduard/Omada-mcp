import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetVpnRouteConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getVpnRouteConfig',
        {
            description:
                '[DEPRECATED] Use getGridPolicyRouting instead. Same GET .../routing/policy-routings endpoint. Note: this tool returns a full aggregated list, while getGridPolicyRouting is page-based (page/pageSize). When migrating, implement pagination to retrieve all policy-based routing rules. Get policy-based routing rules for a site, including source/destination matching criteria and next-hop gateway assignments.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getVpnRouteConfig', async ({ siteId, customHeaders }) => toToolResult(await client.listPolicyRoutes(siteId, customHeaders)))
    );
}
