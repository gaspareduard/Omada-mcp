import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetDeviceTagListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getDeviceTagList',
        {
            description: 'Get the list of device tags defined in a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getDeviceTagList', async ({ siteId, customHeaders }) => toToolResult(await client.getDeviceTagList(siteId, customHeaders)))
    );
}
