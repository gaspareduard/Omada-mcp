import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetNetworkHealthSummaryTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getNetworkHealthSummary',
        {
            description:
                'Composite health snapshot — single call that combines dashboard overview (device/client counts, connectivity), internet/WAN status, client distribution, and recent active threats. Use this as the first call when checking if everything is working or when starting any troubleshooting session. Individual sections gracefully degrade if an endpoint is unavailable.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getNetworkHealthSummary', async ({ siteId, customHeaders }) => {
            const [overview, internet, clientDist, threats] = await Promise.allSettled([
                client.getDashboardOverview(siteId, customHeaders),
                client.getInternetInfo(siteId, customHeaders),
                client.getClientsDistribution(siteId, customHeaders),
                client.getThreatList(
                    {
                        page: 1,
                        pageSize: 5,
                        archived: false,
                        siteList: siteId,
                        startTime: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
                        endTime: Math.floor(Date.now() / 1000),
                    },
                    customHeaders
                ),
            ]);

            return toToolResult({
                overview: overview.status === 'fulfilled' ? overview.value : { _error: String(overview.reason) },
                internet: internet.status === 'fulfilled' ? internet.value : { _error: String(internet.reason) },
                clientDistribution: clientDist.status === 'fulfilled' ? clientDist.value : { _error: String(clientDist.reason) },
                recentThreats: threats.status === 'fulfilled' ? threats.value : { _error: String(threats.reason) },
            });
        })
    );
}
