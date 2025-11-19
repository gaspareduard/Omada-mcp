import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListSitesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listSites',
        {
            description: 'List all sites configured on the Omada controller.',
        },
        wrapToolHandler('listSites', async () => toToolResult(await client.listSites()))
    );
}
