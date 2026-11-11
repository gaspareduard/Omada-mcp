import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

type Client = Pick<OmadaClient, 'listVoucherGroups'>;

export function registerListVoucherGroupsTool(server: McpServer, client: Client): void {
    server.registerTool(
        'listVoucherGroups',
        {
            description: 'List hotspot voucher groups with their code counts, limits and validity. Returns every page.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listVoucherGroups', async ({ siteId, customHeaders }) => toToolResult(await client.listVoucherGroups(siteId, customHeaders)))
    );
}
