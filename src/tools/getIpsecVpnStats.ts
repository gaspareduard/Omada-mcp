import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetIpsecVpnStatsTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = {
        ...createPaginationSchema(),
        ...siteInputSchema.shape,
    };

    server.registerTool(
        'getIpsecVpnStats',
        {
            description:
                'Get IPsec VPN tunnel statistics for a site (paginated), including active IPsec tunnels, traffic metrics, and connection status.',
            inputSchema,
        },
        wrapToolHandler('getIpsecVpnStats', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getIpsecVpnStats(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
