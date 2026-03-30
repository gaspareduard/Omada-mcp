import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetOsgCustomAclListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getOsgCustomAclList',
        {
            description:
                'Get the custom gateway ACL rules list (paginated). Custom ACLs extend the standard gateway ACL rules with user-defined traffic policies.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('getOsgCustomAclList', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getOsgCustomAclList(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
