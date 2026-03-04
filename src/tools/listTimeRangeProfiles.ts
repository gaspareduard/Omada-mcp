import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListTimeRangeProfilesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listTimeRangeProfiles',
        {
            description:
                'List time range profiles configured for a site. These are named schedules (e.g. "Business Hours", "Weekends") used by ACL rules, port schedules, and other time-based policies.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('listTimeRangeProfiles', async ({ siteId, customHeaders }) =>
            toToolResult(await client.listTimeRangeProfiles(siteId, customHeaders))
        )
    );
}
