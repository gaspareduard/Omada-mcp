import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { customHeadersSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListGroupProfilesTool(server: McpServer, client: OmadaClient): void {
    const inputSchema = z.object({
        siteId: z.string().min(1).optional(),
        groupType: z.string().optional().describe('Group type to filter (e.g., "ip", "mac", "port"). Omit to list all group types.'),
        customHeaders: customHeadersSchema,
    });

    server.registerTool(
        'listGroupProfiles',
        {
            description:
                'List group profiles (IP groups, MAC groups, port groups) configured for a site. These are named sets of addresses/ports reused across ACL rules and firewall policies. Filter by groupType: "ip", "mac", or "port".',
            inputSchema: inputSchema.shape,
        },
        wrapToolHandler('listGroupProfiles', async ({ siteId, groupType, customHeaders }) =>
            toToolResult(await client.listGroupProfiles(groupType, siteId, customHeaders))
        )
    );
}
