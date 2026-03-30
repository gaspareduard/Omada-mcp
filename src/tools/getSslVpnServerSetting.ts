import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSslVpnServerSettingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSslVpnServerSetting',
        {
            description: 'Get the SSL VPN server configuration, including port, protocol, and authentication settings.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSslVpnServerSetting', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getSslVpnServerSetting(siteId, customHeaders))
        )
    );
}
