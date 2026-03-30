import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListPortForwardingRulesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listPortForwardingRules',
        {
            description:
                '[DEPRECATED] Use getPortForwardingList instead. Same GET .../nat/port-forwardings endpoint. getPortForwardingList exposes explicit pagination params. List all NAT port forwarding rules for a site: external port, internal IP:port, protocol, enabled state, and rule name. Use getPortForwardingStatus to check User vs UPnP rule state.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listPortForwardingRules', async ({ siteId, customHeaders }) =>
            toToolResult(await client.listPortForwardingRules(siteId, customHeaders))
        )
    );
}
