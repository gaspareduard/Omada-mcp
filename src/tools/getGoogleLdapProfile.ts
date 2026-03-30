import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetGoogleLdapProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGoogleLdapProfile',
        {
            description:
                'Get the Google LDAP profile configuration for a site, including domain, binding credentials, and user/group base DN settings.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getGoogleLdapProfile', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getGoogleLdapProfile(siteId, customHeaders))
        )
    );
}
