import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListMdnsProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listMdnsProfile',
        {
            description: 'List all Bonjour/mDNS service profiles configured on the site for cross-VLAN service discovery.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listMdnsProfile', async ({ siteId, customHeaders }) => toToolResult(await client.listMdnsProfile(siteId, customHeaders)))
    );
}
