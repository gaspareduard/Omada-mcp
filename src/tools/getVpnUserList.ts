import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const inputSchema = z.object({
    page: z.number().int().min(1).default(1).describe('Page number (1-based).'),
    pageSize: z.number().int().min(1).max(1000).default(10).describe('Number of results per page (1–1000).'),
    ...siteInputSchema.shape,
});

export function registerGetVpnUserListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getVpnUserList',
        {
            description: 'Get the list of VPN users for a site (paginated), including username, assigned VPN server, and connection permissions.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getVpnUserList', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getVpnUserList(page, pageSize, siteId, customHeaders))
        )
    );
}
