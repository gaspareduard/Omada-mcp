import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetLanProfileListTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLanProfileList',
        {
            description:
                'Get the list of LAN profiles configured in a site. LAN profiles define network settings that can be applied to switch ports.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getLanProfileList', async ({ siteId }) => toToolResult(await client.getLanProfileList(siteId)))
    );
}
