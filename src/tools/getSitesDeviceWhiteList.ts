import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const inputSchema = siteInputSchema.extend(createPaginationSchema());

export function registerGetSitesDeviceWhiteListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSitesDeviceWhiteList',
        {
            description: 'Get the device whitelist for a site.',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('getSitesDeviceWhiteList', async ({ siteId, page, pageSize, customHeaders }) =>
            toToolResult(await client.getSitesDeviceWhiteList(siteId, page ?? 1, pageSize ?? 10, customHeaders))
        )
    );
}
