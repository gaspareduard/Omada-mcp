import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetMacAuthSsidsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMacAuthSsids',
        {
            description: 'Get per-SSID MAC authentication settings showing which SSIDs have MAC auth enabled and their individual configurations.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getMacAuthSsids', async ({ siteId, customHeaders }) => toToolResult(await client.getMacAuthSsids(siteId, customHeaders)))
    );
}
