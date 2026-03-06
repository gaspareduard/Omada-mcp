import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetLdapProfileListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLdapProfileList',
        {
            description: 'List all LDAP authentication profiles configured on the site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getLdapProfileList', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getLdapProfileList(siteId, customHeaders))
        )
    );
}
