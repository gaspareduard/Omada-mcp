import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

type Client = Pick<OmadaClient, 'listMdnsRules'>;

export function registerListMdnsRulesTool(server: McpServer, client: Client): void {
    server.registerTool(
        'listMdnsRules',
        {
            description:
                'List mDNS (Bonjour) reflector rules: which Bonjour services (listMdnsProfile) are bridged between which networks or VLANs. Returns every page.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listMdnsRules', async ({ siteId, customHeaders }) => toToolResult(await client.listMdnsRules(siteId, customHeaders)))
    );
}
