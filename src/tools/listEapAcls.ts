import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListEapAclsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listEapAcls',
        {
            description:
                'List EAP (access point) ACL rules for a site: wireless client access control rules. Returns rule name, action (allow/deny), SSID scope, source/destination, protocol, and enabled state.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listEapAcls', async ({ siteId, customHeaders }) => toToolResult(await client.listEapAcls(siteId, customHeaders)))
    );
}
