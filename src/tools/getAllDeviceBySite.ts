import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetAllDeviceBySiteTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAllDeviceBySite',
        {
            description:
                'Get all devices in a site including offline and disconnected devices. Unlike listDevices which may filter to active-only, this returns the full device inventory. Useful for auditing what hardware is registered to a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getAllDeviceBySite', async ({ siteId, customHeaders }) =>
            toToolResult(await client.getAllDeviceBySite(siteId, customHeaders))
        )
    );
}
