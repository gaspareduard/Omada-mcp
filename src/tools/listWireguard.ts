import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerListWireguardTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        ...createPaginationSchema(),
        searchKey: z.string().optional().describe('Optional search keyword to filter WireGuard tunnels by name or IP.'),
        ...siteInputSchema.shape,
    });

    server.registerTool(
        'listWireguard',
        {
            description:
                'List WireGuard VPN tunnels (paginated). Returns WireGuard interface configurations including listen port, public key, and allowed IPs. Supports optional keyword search.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listWireguard', async ({ page, pageSize, searchKey, siteId, customHeaders }) =>
            toToolResult(await client.listWireguard(page ?? 1, pageSize ?? 10, searchKey, siteId, customHeaders))
        )
    );
}
