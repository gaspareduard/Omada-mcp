import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetScheduleProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getScheduleProfile',
        {
            description:
                'Get time range (schedule) profiles for a site, listing named time windows that can be applied to firewall rules and access control policies.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getScheduleProfile', async ({ siteId, customHeaders }) =>
            toToolResult(await client.listTimeRangeProfiles(siteId, customHeaders))
        )
    );
}
