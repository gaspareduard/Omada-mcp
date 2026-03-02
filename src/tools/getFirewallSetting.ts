import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetFirewallSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getFirewallSetting',
        {
            description: 'Get firewall configuration and rules for a site, including ACL rules, IP groups, and security policies.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getFirewallSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getFirewallSetting(siteId, customHeaders))
        )
    );
}
