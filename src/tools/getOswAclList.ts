import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetOswAclListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getOswAclList',
        {
            description: 'Get the switch ACL list (paginated). Returns per-port or VLAN-based access control rules applied to managed switches.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('getOswAclList', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getOswAclList(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
