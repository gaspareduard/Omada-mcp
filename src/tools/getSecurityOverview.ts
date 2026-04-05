import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetSecurityOverviewTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSecurityOverview',
        {
            description:
                'Composite security overview — single call that combines active threat list (up to 20 most recent, unarchived) and firewall settings into one response. Use when checking the security posture of the network, investigating alerts, or looking for anything suspicious. Threats are returned newest-first.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getSecurityOverview', async ({ siteId, customHeaders }) => {
            const [threats, firewall] = await Promise.allSettled([
                client.getThreatList(
                    {
                        page: 1,
                        pageSize: 20,
                        archived: false,
                        sortTime: 'desc',
                        siteList: siteId,
                        startTime: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
                        endTime: Math.floor(Date.now() / 1000),
                    },
                    customHeaders
                ),
                client.getFirewallSetting(siteId, customHeaders),
            ]);

            return toToolResult({
                activeThreats: threats.status === 'fulfilled' ? threats.value : { _error: String(threats.reason) },
                firewallSettings: firewall.status === 'fulfilled' ? firewall.value : { _error: String(firewall.reason) },
            });
        })
    );
}
