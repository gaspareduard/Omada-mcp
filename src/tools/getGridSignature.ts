import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

export function registerGetGridSignatureTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getGridSignature',
        {
            description:
                'Get the IPS signature list (paginated). Returns known attack signatures used by the Intrusion Prevention System for traffic inspection.',
            inputSchema: { ...createPaginationSchema(), ...siteInputSchema.shape },
        },
        wrapToolHandler('getGridSignature', async ({ page, pageSize, siteId, customHeaders }) =>
            toToolResult(await client.getGridSignature(page ?? 1, pageSize ?? 10, siteId, customHeaders))
        )
    );
}
